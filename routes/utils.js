const nem = require('nem-sdk').default;

const checkPayments = (transactions, paid = []) => {
  transactions.forEach(tx => {
    'otherTrans' in tx.transaction
      ? paid.push(tx.transaction.otherTrans.amount)
      : paid.push(tx.transaction.amount);
  });

  let sum = paid.reduce((acc, cur) => acc + cur, 0);
  sum /= 10 ** 6;
  return sum;
};

const filterTransactions = (idHash, transactions, filtered = []) => {
  transactions.forEach(tx => {
    const { hexMessage } = nem.utils.format;

    const payload =
      'otherTrans' in tx.transaction
        ? tx.transaction.otherTrans.message.payload
        : tx.transaction.message.payload;

    const message = hexMessage({
      type: 1,
      payload
    });

    if (message === idHash) filtered.push(tx);
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

module.exports = {
  checkPayments,
  filterTransactions,
  getXemPrice
};
