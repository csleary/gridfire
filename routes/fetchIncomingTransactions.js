module.exports = (paymentAddress, idHash, done) => {
  const nem = require('nem-sdk').default;

  const endpoint = nem.model.objects.create('endpoint')(
    process.env.REACT_APP_NEM_NETWORK === 'mainnet'
      ? nem.model.nodes.defaultMainnet
      : nem.model.nodes.defaultTestnet,
    nem.model.nodes.defaultPort
  );

  const nemNode = endpoint.host;
  let incomingTxs = [];
  let paidToDate = 0;
  let txId;

  // Filter transactions to show only those matching the purchase ID.
  const filterTransactions = (transactions, filtered = []) => {
    transactions.forEach((tx) => {
      const { hexMessage } = nem.utils.format;

      // Check first for multisig payments, then normal payments.
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

  // Total payments, check if price has been met.
  const paid = [];
  const checkPayments = (transactions) => {
    transactions.forEach((tx) => {
      'otherTrans' in tx.transaction
        ? paid.push(tx.transaction.otherTrans.amount)
        : paid.push(tx.transaction.amount);
    });

    let sum = paid.reduce((acc, cur) => acc + cur, 0);
    sum *= 10 ** -6;
    return sum;
  };

  const fetchTransactions = async (callback) => {
    const tx = await nem.com.requests.account.transactions.incoming(
      endpoint,
      paymentAddress,
      null,
      txId
    );

    if (tx.data.length === 0 && incomingTxs.length === 0) {
      callback({ incomingTxs, nemNode, paidToDate });
    } else {
      txId = tx.data[tx.data.length - 1].meta.id;
      const filteredTxs = filterTransactions(tx.data);
      paidToDate = checkPayments(filteredTxs);
      incomingTxs = [...incomingTxs, ...filteredTxs];

      if (tx.data.length === 25) {
        fetchTransactions(callback);
      } else {
        callback({
          incomingTxs,
          nemNode,
          paidToDate
        });
      }
    }
  };
  fetchTransactions(res => done(res));
};
