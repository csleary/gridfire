const fetchIncomingTransactions = require('./fetchIncomingTransactions');
const mongoose = require('mongoose');
const requireLogin = require('../middlewares/requireLogin');
const { getXemPrice, recordSale } = require('./utils');

const Release = mongoose.model('releases');
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

      const transactions = await fetchIncomingTransactions(
        paymentAddress,
        paymentHash
      );

      transactions.hasPurchased = hasPurchased;

      if (transactions.paidToDate >= price || hasPurchased) {
        // Add purchase to user account, if not already added. If album price has changed, we check user order history, as price may no longer be met.
        transactions.hasPurchased = true;
        user.purchases.push({ purchaseDate: Date.now(), releaseId });
        user.save();
        recordSale(releaseId);
      }
      res.send(transactions);
    } catch (error) {
      if (error.data) {
        res.status(500).send({
          error: error.data.message
        });
        return;
      }
      res.status(500).send({ error: error.message });
    }
  });

  app.get('/api/nem/price', async (req, res) => {
    try {
      const xemPriceUsd = await getXemPrice();
      res.send({ xemPriceUsd });
    } catch (error) {
      res.status(500).send({ error: error.message });
    }
  });

  app.post('/api/nem/address', requireLogin, async (req, res) => {
    const { nemAddress } = req.body;
    const user = await User.findById(req.user.id);
    user.nemAddress = nemAddress.toUpperCase().replace(/-/g, '');
    user.save();
    res.send(user);
  });
};
