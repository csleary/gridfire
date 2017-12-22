module.exports = (app) => {
  const mongoose = require('mongoose');
  const nem = require('nem-sdk').default;
  const jwt = require('jsonwebtoken');
  const fetchIncomingTransactions = require('./fetchIncomingTransactions');
  const keys = require('../config/keys');
  const requireLogin = require('../middlewares/requireLogin');

  const User = mongoose.model('users');

  const getXemPrice = async () => {
    const xem = await nem.com.requests.market.xem();
    const xemPriceBtc = parseFloat(xem.BTC_XEM.last);
    const btc = await nem.com.requests.market.btc();
    const btcPriceUsd = btc.USD.last;
    const xemPriceUsd = btcPriceUsd * xemPriceBtc;
    return xemPriceUsd;
  };

  app.post('/api/nem/transactions', requireLogin, (req, res) => {
    const { id, paymentAddress, paymentHash, price } = req.body;

    fetchIncomingTransactions(paymentAddress, paymentHash, (transactions) => {
      // Issue download token to user on successful payment.

      // TODO Insert socket module, hold paidToDate and check with each transaction received whether enough has been paid, then move on to the token. Will need to break-out address filter and payment combo into separate files for reuse with the sockets.

      if (transactions.paidToDate >= price) {
        const token = jwt.sign(
          {
            id,
            expiresIn: '1hr'
          },
          keys.nemp3Secret
        );
        res.append('Authorization', `Bearer ${token}`);
        res.send(transactions);
      } else {
        res.send(transactions);
      }
    });
  });

  app.get('/api/nem/price', async (req, res) => {
    const xemPriceUsd = await getXemPrice();
    res.send({ xemPriceUsd });
  });

  app.post('/api/nem/address', requireLogin, async (req, res) => {
    const { nemAddress } = req.body;
    const user = await User.where({ _id: req.user.id }).update({
      nemAddress: nemAddress.toUpperCase().replace(/-/g, '')
    });
    res.send(user);
  });
};
