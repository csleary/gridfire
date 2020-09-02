const {
  checkSignedMessage,
  fetchTransactions,
  fetchMosaics,
  fetchXemPrice,
  fetchXemPriceBinance
} = require('../controllers/nemController');
const { NEM_NETWORK_ID, PAYMENT_ADDRESS, PRODUCTS, QUEUE_CREDITS } = require('../config/constants');
const crypto = require('crypto');
const { humanId } = require('human-id');
const requireLogin = require('../middlewares/requireLogin');
const mongoose = require('mongoose');
const nem = require('nem-sdk').default;
const Payment = mongoose.model('payments');
const Release = mongoose.model('releases');
const Sale = mongoose.model('sales');
const User = mongoose.model('users');
const { publishToQueue } = require(__basedir + '/services/rabbitMQ/publisher');

module.exports = app => {
  app.post('/api/user/transactions', requireLogin, async (req, res) => {
    try {
      const { releaseId, paymentHash } = req.body;
      const { price } = req.session;
      const { _id: custUserId, nemAddress: custNemAddress } = req.user;
      const user = await User.findById(custUserId, 'purchases').exec();
      const release = await Release.findById(releaseId, 'user', { lean: true }).exec();
      const artist = await User.findById(release.user, 'nemAddress', { lean: true }).exec();
      const paymentAddress = artist.nemAddress;
      let hasPurchased = user.purchases.some(purchase => purchase.releaseId.equals(releaseId));
      const { transactions, nemNode, amountPaid } = await fetchTransactions(paymentAddress, paymentHash);

      if (amountPaid >= price && !hasPurchased) {
        const saleId = mongoose.Types.ObjectId();

        const newSale = {
          _id: saleId,
          purchaseDate: Date.now(),
          amountPaid,
          buyer: custUserId,
          buyerAddress: custNemAddress
        };

        await Sale.findOneAndUpdate({ releaseId }, { $addToSet: { purchases: newSale } }, { upsert: true }).exec();

        user.purchases.push({
          purchaseDate: Date.now(),
          releaseId,
          purchaseRef: saleId,
          transactions
        });

        await user.save();
        hasPurchased = true;
      }

      res.send({
        remaining: ((price - amountPaid) / 10 ** 6).toFixed(6),
        hasPurchased,
        nemNode,
        amountPaid: (amountPaid / 10 ** 6).toFixed(6),
        releaseId,
        transactions
      });
    } catch (error) {
      if (error.data) {
        return res.status(500).send({ error: error.data.message });
      }

      res.status(500).send({ error: error.message });
    }
  });

  app.post('/api/user/address', requireLogin, async (req, res) => {
    try {
      const { nemAddress = '', nemAddressChallenge, signedMessage } = req.body;
      const updatedNemAddress = nemAddress.toUpperCase().replace(/-/g, '');
      const user = await User.findById(req.user._id, 'credit nemAddress nemAddressVerified').exec();
      const existingNemAddress = user.nemAddress;
      const addressChanged = updatedNemAddress !== existingNemAddress;

      if (addressChanged) {
        const addressExists = await User.exists({ nemAddress, nemAddressVerified: true });

        if (addressExists) {
          throw new Error('NEM addresses cannot be registered for more than one account. Please use another address.');
        }

        if (!updatedNemAddress) {
          await Release.updateMany({ user: user._id }, { $set: { published: false } }).exec();
        }
        user.nemAddress = updatedNemAddress;
        user.nemAddressChallenge = humanId();
        user.nemAddressVerified = false;
        user.credits = 0;
      }

      if (updatedNemAddress && signedMessage) {
        const parsedMessage = JSON.parse(signedMessage);
        const messageIsValid = checkSignedMessage(nemAddress, nemAddressChallenge, parsedMessage);
        user.nemAddressVerified = messageIsValid;
        if (!messageIsValid) throw new Error('This message is not valid.');
        user.nemAddressChallenge = undefined;
      }

      if (updatedNemAddress && user.nemAddressVerified) {
        const credits = await fetchMosaics(updatedNemAddress);
        user.credits = credits;
      }

      await user.save();
      res.send(user.toJSON());
    } catch (error) {
      res.status(500).send({ error: error.message });
    }
  });

  app.get('/api/user/credits', requireLogin, async (req, res) => {
    try {
      const user = await User.findById(req.user._id, 'credits nemAddress nemAddressVerified').exec();
      if (!user) return res.end();
      const { nemAddress, nemAddressVerified } = user;

      if (nemAddress && nemAddress.length && nemAddressVerified) {
        user.credits = await fetchMosaics(nemAddress);
        await user.save();
        return res.status(200).send({ credits: user.toJSON().credits });
      }

      res.end();
    } catch (error) {
      res.status(500).send({ error: error.message });
    }
  });

  app.get('/api/user/credits/buy', requireLogin, async (req, res) => {
    try {
      delete req.session.productData;
      const xemPriceUsd = await fetchXemPriceBinance().catch(() => fetchXemPrice());
      if (!xemPriceUsd) throw new Error('Price information unavailable.');
      const usdInXem = 1 / xemPriceUsd;

      const productData = PRODUCTS.map(product => {
        product.priceUsd = (product.quantity * product.unitPrice).toString();
        product.priceXem = Number.parseFloat((product.quantity * product.unitPrice * usdInXem).toFixed(6));
        product.priceRawXem = Number.parseInt((product.quantity * product.unitPrice * usdInXem * 10 ** 6).toFixed());
        return product;
      });

      req.session.productData = productData;
      res.send(productData);
    } catch (error) {
      res.status(500).send({ error: error.message });
    }
  });

  app.post('/api/user/credits/buy', requireLogin, async (req, res) => {
    const { sku } = req.body;
    const { productData } = req.session;
    const user = await User.findById(req.user._id, 'auth.idHash').exec();
    if (!user) return res.status(401).end();

    const {
      _id: userId,
      auth: { idHash }
    } = user;

    const nonce = crypto.randomBytes(16).toString('hex');
    const hash = crypto.createHash('sha256');
    const paymentId = hash.update(nonce).update(idHash).digest('hex').substring(0, 32);
    const { priceXem, priceRawXem } = productData.find(product => product.sku === sku);

    await Payment.create({
      dateCreated: Date.now(),
      nonce,
      priceRawXem,
      paymentId,
      sku,
      user: userId
    });

    req.session.nonce = nonce;
    req.session.paymentId = paymentId;
    req.session.priceRawXem = priceRawXem;
    res.send({ nonce, PAYMENT_ADDRESS, paymentId, priceXem });
  });

  app.post('/api/user/credits/confirm', requireLogin, async (req, res) => {
    try {
      const { nonce, paymentId } = req.session;
      const userId = req.user._id;
      const user = await User.findById(userId, 'auth.idHash').exec();
      const { idHash } = user.auth;
      const { clientId, cnonce } = req.body;
      const hash = crypto.createHash('sha256');
      const hashed = hash.update(cnonce).update(idHash).update(nonce).update(paymentId).digest('hex');

      if (hashed !== clientId) {
        return res.status(401).json({ error: 'Not authorised.' });
      }

      const paymentInfo = await Payment.findOne({ nonce, paymentId }, 'priceRawXem sku', { lean: true }).exec();
      if (!paymentInfo) return res.status(401).json({ error: 'Payment session expired. Please begin a new session.' });
      const { priceRawXem, sku } = paymentInfo;
      const { transactions, amountPaid } = await fetchTransactions(PAYMENT_ADDRESS, paymentId);

      let hasPaid = false;
      if (amountPaid >= priceRawXem) {
        hasPaid = true;

        await User.findByIdAndUpdate(
          userId,
          {
            $push: {
              creditPurchases: {
                purchaseDate: Date.now(),
                sku,
                paymentId,
                transactions
              }
            }
          },
          { new: true }
        ).exec();

        await Payment.findByIdAndDelete(paymentInfo._id).exec();
        const [tx] = transactions;
        const { signer } = tx.transaction;
        const sender = nem.utils.format.pubToAddress(signer, NEM_NETWORK_ID);
        publishToQueue('', QUEUE_CREDITS, { job: 'sendCredits', sender, sku, userId });
      }

      res.send({ hasPaid, transactions });
    } catch (error) {
      res.status(500).send({ error: error.message });
    }
  });
};
