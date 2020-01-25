const axios = require('axios');
const nem = require('nem-sdk').default;
const { NEM_NETWORK_ID, NEM_NODES } = require('../config/constants');

const defaultNodes = NEM_NODES.map(node => `http://${node}:7890`);

const queryNodes = async (endpoint, nodesList = defaultNodes) => {
  try {
    const nodes = nodesList.map(node => axios(`${node}${endpoint}`));

    return Promise.race(nodes).catch(async error => {
      const offlineHost = error.hostname;
      return queryNodes(
        endpoint,
        nodesList.filter(node => node !== `http://${offlineHost}:7890`)
      );
    });
  } catch (error) {
    throw new Error(error.message);
  }
};

const findNode = async () => {
  try {
    const getActiveNodes = await queryNodes('/node/peer-list/active');
    const activeNodes = getActiveNodes.data;

    const nodeHosts = activeNodes.data.map(
      node =>
        `${node.endpoint.protocol}://${node.endpoint.host}:${node.endpoint.port}`
    );

    const getFirstNode = await queryNodes('/node/info', nodeHosts);
    const node = getFirstNode.data;
    const { protocol } = node.endpoint;
    const { host } = node.endpoint;
    const { name } = node.identity;
    const { port } = node.endpoint;
    const endpoint = { host: `${protocol}://${host}`, port };
    return { endpoint, host, name, port, protocol };
  } catch (error) {
    throw new Error(`Could not find a responsive NEM node: ${error.message}`);
  }
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

const fetchMosaics = async paymentAddress => {
  const node = await findNode();
  const { endpoint } = node;

  const mosaics = await nem.com.requests.account.mosaics.owned(
    endpoint,
    paymentAddress
  );

  const credits = mosaics.data.filter(
    mosaic =>
      mosaic.mosaicId.namespaceId === 'nemp3' &&
      mosaic.mosaicId.name === 'credits'
  )[0];

  if (!credits) return 0;
  return credits.quantity;
};

const fetchTransactions = async (paymentAddress, idHash) => {
  let txId;
  let total = [];
  let paidToDate = 0;

  try {
    const node = await findNode();
    const { endpoint, name } = node;
    const nemNode = name;

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
        return fetchBatch();
      } else {
        return {
          transactions: total,
          nemNode,
          paidToDate
        };
      }
    };

    return fetchBatch();
  } catch (error) {
    throw new Error(error);
  }
};

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
  fetchXemPrice,
  findNode
};
