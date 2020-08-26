const { checkSignedMessage, fetchTransactions, fetchMosaics } = require('../controllers/nemController');
const { fetchXemPrice, fetchXemPriceBinance } = require('../controllers/nemController');
const crypto = require('crypto');
const requireLogin = require('../middlewares/requireLogin');
const mongoose = require('mongoose');
const Payment = mongoose.model('payments');
const Release = mongoose.model('releases');
const Sale = mongoose.model('sales');
const User = mongoose.model('users');
const { PAYMENT_ADDRESS } = require('../config/constants');

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
      let { nemAddress = '', signedMessage } = req.body;
      nemAddress = nemAddress.toUpperCase().replace(/-/g, '');
      const user = await User.findById(req.user._id, 'credit nemAddress nemAddressVerified').exec();
      const existingNemAddress = user.nemAddress;
      const addressChanged = nemAddress !== existingNemAddress;

      if (addressChanged) {
        const addressExists = await User.exists({ nemAddress, nemAddressVerified: true });
        if (addressExists)
          throw new Error('NEM addresses cannot be registered for more than one account. Please use another address.');
        user.nemAddress = nemAddress;
        user.nemAddressVerified = false;
        user.credits = 0;
      }

      if (nemAddress && signedMessage) {
        signedMessage = JSON.parse(signedMessage);
        user.nemAddressVerified = checkSignedMessage(nemAddress, signedMessage);
      }

      if (nemAddress && user.nemAddressVerified) {
        const credits = await fetchMosaics(nemAddress);
        user.credits = credits;
      }

      user.save();
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
        const publishedReleaseCount = await Release.countDocuments({ user: user.id, published: true });
        const total = await fetchMosaics(nemAddress);
        user.credits = total - publishedReleaseCount;
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
      delete req.session.usdPriceInRawXem;
      const xemPriceUsd = await fetchXemPriceBinance().catch(() => fetchXemPrice());
      if (!xemPriceUsd) throw new Error('Price information unavailable.');
      const usdXem = 1 / xemPriceUsd;
      const usdRawXem = Math.round(usdXem * 10 ** 6);
      req.session.usdRawXem = usdRawXem;
      res.send({ usdRawXem });
    } catch (error) {
      res.status(500).send({ error: error.message });
    }
  });

  app.post('/api/user/credits/buy', requireLogin, async (req, res) => {
    const { creditsId } = req.body;
    const { usdRawXem } = req.session;
    const user = await User.findById(req.user._id, 'auth.idHash').exec();
    if (!user) return res.end();

    const {
      _id: userId,
      auth: { idHash }
    } = user;

    const nonce = crypto.randomBytes(16).toString('hex');

    const prices = {
      '01NPC': (15 * usdRawXem) / 10 ** 6,
      '05NPC': Math.round(70 * usdRawXem * 0.95) / 10 ** 6,
      '10NPC': Math.round(135 * usdRawXem * 0.9) / 10 ** 6
    };

    await Payment.create({
      dateCreated: Date.now(),
      nonce,
      price: prices[creditsId],
      idHash,
      user: userId
    });

    const paymentId = nonce.concat(idHash);
    res.send({ PAYMENT_ADDRESS, paymentId, price: String(prices[creditsId]) });
  });
};
