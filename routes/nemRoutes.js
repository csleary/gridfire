const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const fetchIncomingTransactions = require('./fetchIncomingTransactions');
const keys = require('../config/keys');
const requireLogin = require('../middlewares/requireLogin');
const utils = require('./utils');

const Release = mongoose.model('releases');
const Sale = mongoose.model('sales');
const User = mongoose.model('users');

module.exports = app => {
  app.post('/api/nem/transactions', requireLogin, async (req, res) => {
    const { releaseId, paymentHash } = req.body;
    const { price } = req.session;
    const user = await User.findById(req.user._id);
    const release = await Release.findById(releaseId);
    const artist = await User.findById(release._user);
    const paymentAddress = artist.nemAddress;
    const hasPreviouslyPurchased = user.purchases.some(
      purchase => releaseId === purchase.releaseId
    );

    const transactions = await fetchIncomingTransactions(
      paymentAddress,
      paymentHash
    );

    transactions.hasPreviouslyPurchased = hasPreviouslyPurchased;

    if (transactions.paidToDate >= price || hasPreviouslyPurchased) {
      // Add purchase to user account, if not already added.
      if (!hasPreviouslyPurchased) {
        user.purchases.push({
          purchaseDate: Date.now(),
          releaseId
        });
        user.save();

        // Log sales.
        const date = new Date(Date.now());

        const statExists = await Sale.findOne({
          releaseId,
          'purchases.date': date.toISOString().split('T')[0]
        });

        const query = {
          releaseId
        };
        const update = {
          $addToSet: { purchases: { date: date.toISOString().split('T')[0] } }
        };
        const options = { upsert: true, setDefaultsOnInsert: true };

        const incrementSale = () => {
          const queryInc = {
            releaseId,
            'purchases.date': date.toISOString().split('T')[0]
          };
          const updateInc = { $inc: { 'purchases.$.numSold': 1 } };
          Sale.findOneAndUpdate(queryInc, updateInc, {}, () => {});
        };

        if (!statExists) {
          Sale.findOneAndUpdate(query, update, options, incrementSale);
        } else {
          incrementSale();
        }
      }

      // Issue download token to user on successful payment.
      const token = jwt.sign(
        {
          releaseId,
          expiresIn: '10m'
        },
        keys.nemp3Secret
      );
      res.append('Authorization', `Bearer ${token}`);
    }
    res.send(transactions);
  });

  app.get('/api/nem/price', async (req, res) => {
    const xemPriceUsd = await utils.getXemPrice();
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
