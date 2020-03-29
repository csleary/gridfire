const {
  checkSignedMessage,
  fetchTransactions,
  fetchMosaics,
  fetchXemPrice,
  fetchXemPriceBinance
} = require('../controllers/nemController');
const mongoose = require('mongoose');
const requireLogin = require('../middlewares/requireLogin');

const Release = mongoose.model('releases');
const Sale = mongoose.model('sales');
const User = mongoose.model('users');

module.exports = app => {
  app.post('/api/nem/transactions', requireLogin, async (req, res) => {
    try {
      const { releaseId, paymentHash } = req.body;
      const { price } = req.session;
      const user = await User.findById(req.user._id);
      const release = await Release.findById(releaseId);
      const artist = await User.findById(release.user);
      const paymentAddress = artist.nemAddress;

      const hasPurchased = user.purchases.some(purchase =>
        purchase.releaseId.equals(releaseId)
      );

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

        const update = { $addToSet: { purchases: newSale } };
        const options = { upsert: true };
        Sale.findOneAndUpdate({ releaseId }, update, options).exec();
        payments.hasPurchased = true;

        user.purchases.push({
          purchaseDate: Date.now(),
          releaseId,
          purchaseRef: saleId,
          transactions: payments.transactions
        });

        user.save();
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

  app.get('/api/nem/price', async (req, res) => {
    try {
      const xemPriceUsd = await fetchXemPriceBinance();
      res.send({ xemPriceUsd });
    } catch (error) {
      try {
        const xemPriceUsd = await fetchXemPrice();
        res.send({ xemPriceUsd });
      } catch (backupError) {
        if ((error.data && error.data === 'error code: 1006') || backupError)
          res.status(500).send({ error: 'Price data currently unavailable.' });
        else res.status(500).send({ error: error.message });
      }
    }
  });

  app.post('/api/nem/address', requireLogin, async (req, res) => {
    try {
      const signedMessage =
        req.body.signedMessage && JSON.parse(req.body.signedMessage);
      const nemAddress = req.body.nemAddress.toUpperCase().replace(/-/g, '');
      const user = await User.findById(req.user.id).select('-auth.password');
      const existingNemAddress = user.nemAddress;
      const addressChanged = nemAddress !== existingNemAddress;

      if (addressChanged) {
        user.nemAddress = nemAddress;
        user.nemAddressVerified = false;
        user.credit = 0;
      }

      if (nemAddress && signedMessage) {
        user.nemAddressVerified = checkSignedMessage(nemAddress, signedMessage);
      }

      if (nemAddress && user.nemAddressVerified) {
        const credit = await fetchMosaics(nemAddress);
        user.credit = credit;
      }

      user.save();
      res.send(user);
    } catch (error) {
      res
        .status(500)
        .send({ error: `We could not verify your address: ${error.message}` });
    }
  });

  app.get('/api/nem/credit', requireLogin, async (req, res) => {
    try {
      const user = await User.findById(req.user.id).select('-auth.password');
      const { nemAddress, nemAddressVerified } = user;

      if (nemAddress && nemAddressVerified) {
        user.credit = await fetchMosaics(nemAddress);
        user.save();
        res.send(user);
        return;
      }

      res.end();
    } catch (error) {
      res.status(500).send({ error: error.message });
    }
  });
};
