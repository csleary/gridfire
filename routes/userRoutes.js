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
      const user = await User.findById(req.user._id).exec();
      const release = await Release.findById(releaseId, { user: 1 }, { lean: true }).exec();
      const artist = await User.findById(release.user).exec();
      const paymentAddress = artist.nemAddress;
      const hasPurchased = user.purchases.some(purchase => purchase.releaseId.equals(releaseId));
      const payments = await fetchTransactions(paymentAddress, paymentHash);
      payments.hasPurchased = hasPurchased;

      if (payments.paidToDate >= price && !hasPurchased) {
        const saleId = mongoose.Types.ObjectId();

        const newSale = {
          _id: saleId,
          purchaseDate: Date.now(),
          amountPaid: payments.paidToDate,
          buyer: req.user._id,
          buyerAddress: req.user.nemAddress
        };

        await Sale.findOneAndUpdate({ releaseId }, { $addToSet: { purchases: newSale } }, { upsert: true }).exec();

        payments.hasPurchased = true;

        user.purchases.push({
          purchaseDate: Date.now(),
          releaseId,
          purchaseRef: saleId,
          transactions: payments.transactions
        });

        await user.save();
      }

      res.send(payments);
    } catch (error) {
      if (error.data) {
        res.status(500).send({ error: error.data.message });
        return;
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
      res.status(500).send({ error: `We could not verify your address: ${error.message}` });
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
        res.status(200).send({ credits: user.toJSON().credits });
        return;
      }

      res.end();
    } catch (error) {
      res.status(500).send({ error: error.message });
    }
  });
};
