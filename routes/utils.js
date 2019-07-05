const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const nem = require('nem-sdk').default;
const { NEM_NETWORK_ID } = require('./constants');
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

const checkSignedMessage = (address, signedMessage) => {
  const { message, signer, signature } = signedMessage;

  const verified = nem.crypto.verifySignature(
    signer.toString(),
    message,
    signature.toString()
  );

  if (verified) {
    const keyToAddress = nem.model.address.toAddress(
      signer.toString(),
      NEM_NETWORK_ID
    );

    return keyToAddress === address;
  }

  return false;
};

module.exports = {
  checkPayments,
  filterTransactions,
  generateToken,
  getXemPrice,
  checkSignedMessage
};
