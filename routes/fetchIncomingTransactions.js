const nem = require('nem-sdk').default;
const { checkPayments, filterTransactions } = require('./utils');
const { NEM_NODE } = require('./constants');

module.exports = (paymentAddress, idHash) =>
  new Promise((resolve, reject) => {
    const endpoint = nem.model.objects.create('endpoint')(
      NEM_NODE,
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
      const filteredTxs = filterTransactions(idHash, currentBatch);
      const payments = checkPayments(filteredTxs);
      paidToDate += payments;
      total = [...total, ...filteredTxs];

      if (currentBatch.length === 25) {
        txId = currentBatch[currentBatch.length - 1].meta.id;
        fetchTransactions();
      } else {
        resolve({
          transactions: total,
          nemNode,
          paidToDate
        });
      }
    };
    fetchTransactions().catch(error => {
      reject(error);
    });
  });
