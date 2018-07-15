const nem = require('nem-sdk').default;

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

const getXemPrice = async () => {
  const xem = await nem.com.requests.market.xem();
  const xemPriceBtc = parseFloat(xem.BTC_XEM.last);
  const btc = await nem.com.requests.market.btc();
  const btcPriceUsd = btc.USD.last;
  const xemPriceUsd = btcPriceUsd * xemPriceBtc;
  return xemPriceUsd;
};

const userOwnsRelease = (user, release) => {
  if (user._id.toString() === release.user.toString()) {
    return true;
  }
  return false;
};

module.exports = {
  checkPayments,
  filterTransactions,
  getXemPrice,
  userOwnsRelease
};
