import crypto from 'crypto';
import { fetchXemPrice, fetchXemPriceBinance } from '../controllers/nemController.js';
import nemSdk from 'nem-sdk';
import Release from '../models/Release.js';
import Sale from '../models/Sale.js';
import User from '../models/User.js';
const nem = nemSdk.default;
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

export { createInvoice, createSale, matchTransaction };
