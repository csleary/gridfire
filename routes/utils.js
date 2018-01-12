const nem = require('nem-sdk').default;

module.exports.filterTransactions = (idHash, transactions, filtered = []) => {
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

module.exports.checkPayments = (transactions, paid = []) => {
  transactions.forEach(tx => {
    'otherTrans' in tx.transaction
      ? paid.push(tx.transaction.otherTrans.amount)
      : paid.push(tx.transaction.amount);
  });

  let sum = paid.reduce((acc, cur) => acc + cur, 0);
  sum *= 10 ** -6;
  return sum;
};
