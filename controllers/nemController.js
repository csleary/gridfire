const nem = require('nem-sdk').default;
const { NEM_NETWORK_ID, NEM_NODE } = require('../config/constants');

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

const fetchMosaics = paymentAddress =>
  new Promise(async resolve => {
    const endpoint = nem.model.objects.create('endpoint')(
      NEM_NODE,
      nem.model.nodes.defaultPort
    );

    const mosaics = await nem.com.requests.account.mosaics.owned(
      endpoint,
      paymentAddress
    );

    mosaics.data.forEach(mosaic => {
      if (
        mosaic.mosaicId.namespaceId === 'nemp3' &&
        mosaic.mosaicId.name === 'credits'
      ) {
        resolve(mosaic.quantity);
      }
    });
    resolve(0);
  });

const fetchTransactions = (paymentAddress, idHash) =>
  new Promise((resolve, reject) => {
    const endpoint = nem.model.objects.create('endpoint')(
      NEM_NODE,
      nem.model.nodes.defaultPort
    );

    const nemNode = endpoint.host;
    let txId;
    let total = [];
    let paidToDate = 0;

    try {
      const fetchBatch = async () => {
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
          fetchBatch();
        } else {
          resolve({
            transactions: total,
            nemNode,
            paidToDate
          });
        }
      };

      fetchBatch();
    } catch (error) {
      reject(error);
    }
  });

const fetchXemPrice = async () => {
  const xem = await nem.com.requests.market.xem();
  const xemPriceBtc = parseFloat(xem.BTC_XEM.last);
  const btc = await nem.com.requests.market.btc();
  const btcPriceUsd = btc.USD.last;
  const xemPriceUsd = btcPriceUsd * xemPriceBtc;
  return xemPriceUsd;
};

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

module.exports = {
  checkSignedMessage,
  fetchMosaics,
  fetchTransactions,
  fetchXemPrice
};
