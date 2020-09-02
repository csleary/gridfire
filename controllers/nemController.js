const axios = require('axios');
const nem = require('nem-sdk').default;
const { NEM_NETWORK_ID, NEM_NODES } = require('../config/constants');
const defaultNodes = NEM_NODES.map(node => `http://${node}:7890`);
const { hexMessage } = nem.utils.format;

const queryNodes = async (endpoint, nodesList = defaultNodes) => {
  const randomNode = nodesList[Math.floor(Math.random() * nodesList.length)];
  console.log(`Trying node [${randomNode}]…`);
  const res = await axios(`${randomNode}${endpoint}`).catch(() => false);
  return res.data;
};

const findNode = async (attempt = 0) => {
  try {
    const node = await queryNodes('/node/info');

    if (!node && attempt < 10) {
      return findNode(attempt + 1);
    } else if (!node) {
      throw new Error(`Tried ${attempt} times to find a node without success.`);
    }

    const { protocol, host, port } = node.endpoint;
    const { name } = node.identity;
    const endpoint = { host: `${protocol}://${host}`, port };
    return { endpoint, host, name, port, protocol };
  } catch ({ message }) {
    console.error(message);
    throw new Error('Could not find a NEM node.');
  }
};

const checkSignedMessage = (address, nemAddressChallenge, signedMessage) => {
  const { message, signer, signature } = signedMessage;
  const verified = nem.crypto.verifySignature(signer.toString(), message, signature.toString());

  if (verified) {
    let convertedMessage = nem.utils.convert.hex2a(message);
    const keyToAddress = nem.model.address.toAddress(signer.toString(), NEM_NETWORK_ID);
    return keyToAddress === address && convertedMessage === nemAddressChallenge;
  }
  return false;
};

const fetchMosaics = async paymentAddress => {
  try {
    const node = await findNode();
    const { endpoint } = node;
    const mosaics = await nem.com.requests.account.mosaics.owned(endpoint, paymentAddress);

    const credits = mosaics.data.find(
      ({ mosaicId }) => mosaicId.namespaceId === 'nemp3' && mosaicId.name === 'credits'
    );

    if (!credits) return 0;
    return credits.quantity;
  } catch (error) {
    throw new Error(`Error during credits fetch. ${error.message}`);
  }
};

const fetchTransactions = async (address, idHash) => {
  let transactions = [];
  let amountPaid = 0;

  try {
    const node = await findNode().catch(error => {
      throw new Error(error);
    });

    const { endpoint, name: nemNode } = node;

    const fetchRecent = async txId => {
      const incoming = await nem.com.requests.account.transactions.incoming(endpoint, address, null, txId);
      if (!incoming) throw new Error('Could not fetch recent transactions.');
      const { data } = incoming;

      if (data.length) {
        const recent = filterTransactions(idHash, data);
        amountPaid += recentPayments(recent);
        transactions = [...transactions, ...recent];
      }

      if (data.length === 25) {
        const { id } = data[data.length - 1].meta;
        return fetchRecent(id);
      } else {
        return { transactions, nemNode, amountPaid };
      }
    };

    return fetchRecent();
  } catch (error) {
    console.error(error);
    throw new Error(`Error fetching transactions. ${error.message}`);
  }
};

const recentPayments = transactions =>
  transactions
    .map(tx => {
      const { amount, otherTrans, type } = tx.transaction;
      if (type === 257) return amount;
      return otherTrans.amount;
    })
    .reduce((total, current) => total + current, 0);

const filterTransactions = (idHash, transactions = []) =>
  transactions.filter(tx => {
    if (!tx) return false;
    const { type, message, otherTrans } = tx.transaction;
    if (type === 257) return idHash === hexMessage(message);
    if (type === 4100 && otherTrans.type === 257) return idHash === hexMessage(otherTrans.message);
    return false;
  });

const fetchXemPrice = async () => {
  try {
    const xem = await nem.com.requests.market.xem();
    const xemPriceBtc = parseFloat(xem.BTC_XEM.last);
    const btc = await nem.com.requests.market.btc();
    const btcPriceUsd = btc.USD.last;
    const xemPriceUsd = btcPriceUsd * xemPriceBtc;
    return xemPriceUsd;
  } catch (error) {
    throw new Error(error.message || error);
  }
};

const fetchXemPriceBinance = async () => {
  try {
    const xemTicker = await axios('https://api.binance.com/api/v3/ticker/price?symbol=XEMBTC');
    const btcTicker = await axios('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT');
    if (!xemTicker || !btcTicker) throw new Error('Could not retrieve XEM price.');
    const xemPriceBtc = xemTicker.data.price;
    const btcPriceUsd = btcTicker.data.price;
    const xemPriceUsd = btcPriceUsd * xemPriceBtc;
    return xemPriceUsd;
  } catch (error) {
    throw new Error(error.message || error);
  }
};

const formatAddress = address =>
  address &&
  address
    .toUpperCase()
    .replace(/-/g, '')
    .match(/.{1,6}/g)
    .join('-');

module.exports = {
  checkSignedMessage,
  fetchMosaics,
  fetchTransactions,
  fetchXemPrice,
  fetchXemPriceBinance,
  formatAddress,
  findNode
};
