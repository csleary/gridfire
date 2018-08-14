const fetchIncomingTransactions = require('./fetchIncomingTransactions');
const mongoose = require('mongoose');
const requireLogin = require('../middlewares/requireLogin');
const { generateToken, getXemPrice, recordSale } = require('./utils');

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
        // Add purchase to user account, if not already added.
        if (!hasPurchased) {
          user.purchases.push({ purchaseDate: Date.now(), releaseId });
          user.save();
          recordSale(releaseId);
        }
        //
        // // Issue download token to user on successful payment.
        // const token = generateToken({ releaseId });
        //
        // res.append('Authorization', `Bearer ${token}`);
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
    const xemPriceUsd = await getXemPrice();
    res.send({ xemPriceUsd });
  });

  app.post('/api/nem/address', requireLogin, async (req, res) => {
    const { nemAddress } = req.body;
    const user = await User.findById(req.user.id);
    user.nemAddress = nemAddress.toUpperCase().replace(/-/g, '');
    user.save();
    res.send(user);
  });
};
