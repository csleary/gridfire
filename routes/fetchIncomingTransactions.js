const nem = require('nem-sdk').default;
const utils = require('./utils');

module.exports = (paymentAddress, idHash, done) => {
  const endpoint = nem.model.objects.create('endpoint')(
    process.env.REACT_APP_NEM_NETWORK === 'mainnet'
      ? nem.model.nodes.defaultMainnet
      : nem.model.nodes.defaultTestnet,
    nem.model.nodes.defaultPort
  );

  const nemNode = endpoint.host;
  let txId;
  let incomingTxs = [];
  let paidToDate = 0;

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
      const filteredTxs = utils.filterTransactions(idHash, tx.data);
      const payments = utils.checkPayments(filteredTxs);
      paidToDate += payments;
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
