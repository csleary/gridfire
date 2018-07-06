const nem = require('nem-sdk').default;
const utils = require('./utils');

module.exports = (paymentAddress, idHash) =>
  new Promise(async resolve => {
    let nodeHost;
    let nodeName;

    if (process.env.NEM_NETWORK === 'mainnet') {
      nodeHost = nem.model.nodes.defaultMainnet;
    } else {
      nodeHost = nem.model.nodes.defaultTestnet;
    }

    const endpoint = nem.model.objects.create('endpoint')(
      nodeHost,
      nem.model.nodes.defaultPort
    );

    const nemNode = nodeName || endpoint.host;
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
