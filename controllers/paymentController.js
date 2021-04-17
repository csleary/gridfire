const crypto = require('crypto');
const { fetchXemPrice, fetchXemPriceBinance } = require(__basedir + '/controllers/nemController');
const nem = require('nem-sdk').default;
const Release = require(__basedir + '/models/Release');
const Sale = require(__basedir + '/models/Sale');
const User = require(__basedir + '/models/User');
const { hexMessage } = nem.utils.format;

const createInvoice = async (releaseId, userId) => {
  const release = await Release.findById(releaseId, 'artistName releaseTitle price user', { lean: true });
  const xemPriceUsd = await fetchXemPriceBinance().catch(() => fetchXemPrice());
  const priceInXem = release.price / xemPriceUsd;
  const priceInRawXem = Math.ceil(priceInXem * 10 ** 6);
  const owner = await User.findById(release.user, 'nemAddress', { lean: true });
  const customer = await User.findById(userId, 'auth.idHash', { lean: true });
  const customerIdHash = customer.auth.idHash;
  const hash = crypto.createHash('sha256');
  const paymentHash = hash.update(release._id.toString()).update(customerIdHash).digest('hex').substring(0, 24);
  const paymentAddress = owner.nemAddress;
  const { artistName, releaseTitle } = release;
  const invoiceRelease = { artistName, releaseTitle };
  return { paymentAddress, paymentHash, priceInRawXem, release: invoiceRelease };
};

const createSale = ({ amountPaid, paymentAddress, releaseId, transactions, userId }) => {
  return Sale.create({
    purchaseDate: Date.now(),
    release: releaseId,
    amountPaid,
    transactions,
    user: userId,
    userAddress: paymentAddress
  });
};

const matchTransaction = (data, paymentHash) => {
  const parsedMessage = JSON.parse(data.body);
  const { transaction } = parsedMessage;
  const { message, otherTrans, type } = transaction;
  let decodedMessage;
  if (type === 257) decodedMessage = hexMessage(message);
  if (type === 4100 && otherTrans.type === 257) decodedMessage = hexMessage(otherTrans.message);
  return decodedMessage === paymentHash;
};

module.exports = { createInvoice, createSale, matchTransaction };
