const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const nem = require('nem-sdk').default;
const { nemp3Secret } = require('../config/keys');

const Sale = mongoose.model('sales');

const checkPayments = (transactions, paid = []) => {
  transactions.forEach(tx => {
    const { amount, otherTrans } = tx.transaction;
    const payment = amount || otherTrans.amount;
    paid.push(payment);
  });

  let sum = paid.reduce((acc, cur) => acc + cur, 0);
  sum /= 10 ** 6;
  return sum;
};

const filterTransactions = (idHash, transactions, filtered = []) => {
  const transferTransactions = transactions.filter(tx => {
    const { type, otherTrans } = tx.transaction;
    if (type === 257) {
      return true;
    }
    if (type === 4100 && otherTrans.type === 257) {
      return true;
    }
    return false;
  });

  transferTransactions.forEach(tx => {
    const { hexMessage } = nem.utils.format;
    const { message, otherTrans } = tx.transaction;
    const encodedMessage = message || (otherTrans && otherTrans.message);
    const decoded = hexMessage(encodedMessage);
    if (decoded === idHash) filtered.push(tx);
  });
  return filtered;
};

const generateToken = payload =>
  jwt.sign(payload, nemp3Secret, { expiresIn: '10m' });

const getXemPrice = async () => {
  const xem = await nem.com.requests.market.xem();
  const xemPriceBtc = parseFloat(xem.BTC_XEM.last);
  const btc = await nem.com.requests.market.btc();
  const btcPriceUsd = btc.USD.last;
  const xemPriceUsd = btcPriceUsd * xemPriceBtc;
  return xemPriceUsd;
};

const recordSale = async releaseId => {
  const date = new Date(Date.now()).toISOString().split('T')[0];

  const statExists = await Sale.findOne({
    releaseId,
    'purchases.date': date
  });

  const incrementSale = () => {
    const query = { releaseId, 'purchases.date': date };
    const update = { $inc: { 'purchases.$.numSold': 1 } };
    Sale.findOneAndUpdate(query, update).exec();
  };

  if (!statExists) {
    const query = { releaseId };
    const update = { $addToSet: { purchases: { date } } };
    const options = { upsert: true, setDefaultsOnInsert: true };
    Sale.findOneAndUpdate(query, update, options, incrementSale);
  } else {
    incrementSale();
  }
};

module.exports = {
  checkPayments,
  filterTransactions,
  generateToken,
  getXemPrice,
  recordSale
};
