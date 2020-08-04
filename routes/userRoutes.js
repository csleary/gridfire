const { checkSignedMessage, fetchTransactions, fetchMosaics } = require('../controllers/nemController');
const requireLogin = require('../middlewares/requireLogin');
const mongoose = require('mongoose');
const Release = mongoose.model('releases');
const Sale = mongoose.model('sales');
const User = mongoose.model('users');

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
      const user = await User.findById(req.user._id).select('credits nemAddress nemAddressVerified');
      if (!user) return res.end();
      const { nemAddress, nemAddressVerified } = user;

      if (nemAddress && nemAddress.length && nemAddressVerified) {
        const numActiveReleases = await Release.countDocuments({ user: user.id, published: true });
        const numCredits = await fetchMosaics(nemAddress);
        user.credits = numCredits - numActiveReleases;
        await user.save();
        return res.status(200).send({ credits: user.toJSON().credits });
      }

      res.end();
    } catch (error) {
      res.status(500).send({ error: error.message });
    }
  });
};
