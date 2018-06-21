const nem = require('nem-sdk').default;
const utils = require('./utils');

module.exports = (paymentAddress, idHash) =>
  new Promise(resolve => {
    const endpoint = nem.model.objects.create('endpoint')(
      process.env.NEM_NETWORK === 'mainnet'
        ? nem.model.nodes.defaultMainnet
        : nem.model.nodes.defaultTestnet,
      nem.model.nodes.defaultPort
    );

    const nemNode = endpoint.host;
    let txId;
    let total = [];
    let paidToDate = 0;

    const fetchTransactions = async () => {
      const incoming = await nem.com.requests.account.transactions.incoming(
        endpoint,
        paymentAddress,
        null,
        txId
      );

      const currentBatch = incoming.data || [];
      const filteredTxs = utils.filterTransactions(idHash, currentBatch);
      const payments = utils.checkPayments(filteredTxs);
      paidToDate += payments;
      total = [...total, ...filteredTxs];

      if (currentBatch.length === 25) {
        txId = currentBatch[currentBatch.length - 1].meta.id;
        fetchTransactions();
      } else {
        resolve({
          incomingTxs: total,
          nemNode,
          paidToDate
        });
      }
    };
    fetchTransactions();
  });
