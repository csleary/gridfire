const { NEM_NETWORK_ID, PAYMENT_ADDRESS, PRODUCTS, QUEUE_CREDITS } = require(__basedir + '/config/constants');
const { checkSignedMessage, fetchMosaics, fetchTransactions, fetchXemPrice, fetchXemPriceBinance } = require(__basedir +
  '/controllers/nemController');
const crypto = require('crypto');
const { humanId } = require('human-id');
const mongoose = require('mongoose');
const nem = require('nem-sdk').default;
const { publishToQueue } = require(__basedir + '/services/rabbitMQ/publisher');
const CreditPayment = mongoose.model('credit-payments');
const Payment = mongoose.model('payments');
const Release = mongoose.model('releases');
const Sale = mongoose.model('sales');
const User = mongoose.model('users');

const getUser = async userId => {
  const [user] = await User.aggregate([
    { $match: { _id: userId } },
    { $lookup: { from: 'favourites', localField: '_id', foreignField: 'user', as: 'favourites' } },
    { $lookup: { from: 'wishlists', localField: '_id', foreignField: 'user', as: 'wishList' } },
    { $lookup: { from: 'sales', localField: '_id', foreignField: 'user', as: 'purchases' } },
    { $project: { __v: 0 } }
  ]).exec();

  return user;
};

const getUserCredits = async userId => {
  const user = await User.findById(userId, 'credits nemAddress nemAddressVerified').exec();
  if (!user) return;
  const { nemAddress, nemAddressVerified } = user;

  if (nemAddress && nemAddress.length && nemAddressVerified) {
    user.credits = await fetchMosaics(nemAddress);
    await user.save();
    return { credits: user.toJSON().credits };
  }
};

const getUserTransactions = async ({ user, releaseId, paymentHash, price }) => {
  const { _id: custUserId, nemAddress: custNemAddress } = user;
  const release = await Release.findById(releaseId, 'user', { lean: true }).exec();
  const artist = await User.findById(release.user, 'nemAddress', { lean: true }).exec();
  const paymentAddress = artist.nemAddress;
  let [sale] = await Sale.find({ user: custUserId, release: releaseId }, 'amountPaid transactions', { lean: true });
  let hasPurchased = Boolean(sale);

  if (hasPurchased) {
    return {
      remaining: '0',
      hasPurchased,
      nemNode: '',
      amountPaid: sale.amountPaid.toFixed(6),
      releaseId,
      transactions: sale.transactions
    };
  }

  const { transactions, nemNode, amountPaid } = await fetchTransactions(paymentAddress, paymentHash);

  if (amountPaid >= price && !hasPurchased) {
    await Sale.create({
      purchaseDate: Date.now(),
      release: releaseId,
      amountPaid,
      transactions,
      user: custUserId,
      userAddress: custNemAddress
    });

    hasPurchased = true;
  }

  return {
    remaining: ((price - amountPaid) / 10 ** 6).toFixed(6),
    hasPurchased,
    nemNode,
    amountPaid: (amountPaid / 10 ** 6).toFixed(6),
    releaseId,
    transactions
  };
};

const creditPricing = async () => {
  const xemPriceUsd = await fetchXemPriceBinance().catch(() => fetchXemPrice());
  if (!xemPriceUsd) throw new Error('Price information unavailable.');
  const usdInXem = 1 / xemPriceUsd;

  return PRODUCTS.map(product => {
    product.priceUsd = (product.quantity * product.unitPrice).toString();
    product.priceXem = Number.parseFloat((product.quantity * product.unitPrice * usdInXem).toFixed(6));
    product.priceRawXem = Number.parseInt((product.quantity * product.unitPrice * usdInXem * 10 ** 6).toFixed());
    return product;
  });
};

const creditPurchase = async ({ userId, sku, productData }) => {
  const user = await User.findById(userId, 'auth.idHash').exec();
  if (!user) throw new Error('User not found or not authorised.');
  const { idHash } = user.auth;
  const nonce = crypto.randomBytes(16).toString('hex');
  const hash = crypto.createHash('sha256');
  const paymentId = hash.update(nonce).update(idHash).digest('hex').substring(0, 32);
  const { priceXem, priceRawXem } = productData.find(product => product.sku === sku);

  await Payment.create({
    dateCreated: Date.now(),
    nonce,
    priceRawXem,
    paymentId,
    sku,
    user: user._id
  });

  return { nonce, paymentId, priceRawXem, priceXem };
};

const creditConfirmation = async ({ userId, clientId, cnonce, nonce, paymentId }) => {
  const user = await User.findById(userId, 'auth.idHash').exec();
  const { idHash } = user.auth;
  const hash = crypto.createHash('sha256');
  const hashed = hash.update(cnonce).update(idHash).update(nonce).update(paymentId).digest('hex');
  if (hashed !== clientId) throw new Error('Not authorised.');
  const paymentInfo = await Payment.findOne({ nonce, paymentId }, 'priceRawXem sku', { lean: true }).exec();
  if (!paymentInfo) throw new Error('Payment session expired. Please begin a new session.');
  const { priceRawXem, sku } = paymentInfo;
  const { transactions, amountPaid } = await fetchTransactions(PAYMENT_ADDRESS, paymentId);

  let hasPaid = false;
  if (amountPaid >= priceRawXem) {
    hasPaid = true;

    await CreditPayment.create({
      user: userId,
      purchaseDate: Date.now(),
      sku,
      paymentId,
      transactions
    });

    await Payment.findByIdAndDelete(paymentInfo._id).exec();
    const [tx] = transactions;
    const { signer } = tx.transaction;
    const sender = nem.utils.format.pubToAddress(signer, NEM_NETWORK_ID);
    publishToQueue('', QUEUE_CREDITS, { job: 'sendCredits', sender, sku, userId });
  }

  return { hasPaid, transactions };
};

const setUserNemAddress = async ({ userId, nemAddress, nemAddressChallenge, signedMessage }) => {
  const updatedNemAddress = nemAddress.toUpperCase().replace(/-/g, '');
  const user = await User.findById(userId, 'credit nemAddress nemAddressVerified').exec();
  const existingNemAddress = user.nemAddress;
  const addressChanged = updatedNemAddress !== existingNemAddress;

  if (addressChanged) {
    const addressExists = await User.exists({ nemAddress, nemAddressVerified: true });

    if (addressExists) {
      throw new Error('NEM addresses cannot be registered for more than one account. Please use another address.');
    }

    if (!updatedNemAddress) {
      await Release.updateMany({ user: user._id }, { $set: { published: false } }).exec();
    }
    user.nemAddress = updatedNemAddress;
    user.nemAddressChallenge = humanId();
    user.nemAddressVerified = false;
    user.credits = 0;
  }

  if (updatedNemAddress && signedMessage) {
    const parsedMessage = JSON.parse(signedMessage);
    const messageIsValid = checkSignedMessage(nemAddress, nemAddressChallenge, parsedMessage);
    user.nemAddressVerified = messageIsValid;
    if (!messageIsValid) throw new Error('This message is not valid.');
    user.nemAddressChallenge = undefined;
  }

  if (updatedNemAddress && user.nemAddressVerified) {
    const credits = await fetchMosaics(updatedNemAddress);
    user.credits = credits;
  }

  await user.save();
  return user.toJSON();
};

module.exports = {
  creditPricing,
  creditPurchase,
  creditConfirmation,
  getUser,
  getUserCredits,
  getUserTransactions,
  setUserNemAddress
};
