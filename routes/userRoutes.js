const {
  creditPricing,
  creditPurchase,
  creditConfirmation,
  getUser,
  getUserCredits,
  getUserTransactions,
  setUserNemAddress
} = require(__basedir + '/controllers/userController');
const { generateToken, verifyToken } = require(__basedir + '/controllers/tokenController');
const express = require('express');
const { PAYMENT_ADDRESS } = require(__basedir + '/config/constants');
const requireLogin = require(__basedir + '/middlewares/requireLogin');
const router = express.Router();
const Favourite = require(__basedir + '/models/Favourite');
const Release = require(__basedir + '/models/Release');
const Sale = require(__basedir + '/models/Sale');
const Wish = require(__basedir + '/models/Wish');

router.get('/', async (req, res) => {
  if (!req.user) return res.end();
  const user = await getUser(req.user._id);
  res.send(user);
});

router.post('/address', requireLogin, async (req, res) => {
  try {
    const { nemAddress = '', nemAddressChallenge, signedMessage } = req.body;
    const user = await setUserNemAddress({ userId: req.user._id, nemAddress, nemAddressChallenge, signedMessage });
    res.send(user);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

router.get('/collection/', requireLogin, async (req, res) => {
  const collection = await Sale.find({ user: req.user._id }, '', { lean: true, sort: '-purchaseDate' })
    .populate({
      path: 'release',
      model: Release,
      options: { lean: true },
      select: 'artistName artwork releaseTitle trackList._id trackList.trackTitle'
    })
    .exec();

  res.send(collection);
});

router.get('/credits', requireLogin, async (req, res) => {
  try {
    const credits = await getUserCredits(req.user._id);
    if (!credits) return res.end();
    res.send(credits);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

router.get('/credits/purchase', requireLogin, async (req, res) => {
  try {
    const creditPricingData = await creditPricing();
    const creditPricingToken = generateToken({ creditPricingData });

    res.cookie('creditPricing', creditPricingToken, {
      httpOnly: true,
      maxAge: 1000 * 60 * 10,
      sameSite: 'Strict',
      secure: process.env.NODE_ENV === 'production',
      signed: true
    });

    res.send(creditPricingData);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

router.post('/credits/purchase', requireLogin, async (req, res) => {
  try {
    const { sku } = req.body;
    const creditPricingToken = req.signedCookies.creditPricing;
    const { creditPricingData } = verifyToken(creditPricingToken);

    const { nonce, paymentId, priceRawXem, priceXem } = await creditPurchase({
      userId: req.user._id,
      sku,
      creditPricingData
    });

    const creditSessionData = { nonce, paymentId, priceRawXem };
    const creditSessionToken = generateToken(creditSessionData);

    res.cookie('creditSession', creditSessionToken, {
      httpOnly: true,
      maxAge: 1000 * 60 * 10,
      sameSite: 'Strict',
      secure: process.env.NODE_ENV === 'production',
      signed: true
    });

    res.send({ nonce, PAYMENT_ADDRESS, paymentId, priceXem });
  } catch (error) {
    res.status(401).send({ error: 'We could not create your purchase.' });
  }
});

router.post('/credits/confirm', requireLogin, async (req, res) => {
  try {
    const { clientId, cnonce } = req.body;
    const creditSessionToken = req.signedCookies.creditSession;
    if (!creditSessionToken) throw new Error('Payment session expired. Please begin a new session.');
    const { nonce, paymentId } = verifyToken(creditSessionToken);
    const userId = req.user._id;
    const { hasPaid = false, transactions } = await creditConfirmation({ userId, clientId, cnonce, nonce, paymentId });
    if (hasPaid) res.clearCookie('creditSession');
    res.send({ hasPaid, transactions });
  } catch (error) {
    res.status(401).send({ error: error.message });
  }
});

router.get('/favourites/', requireLogin, async (req, res) => {
  const userFavourites = await Favourite.find({ user: req.user._id }, '', {
    lean: true,
    sort: '-release.releaseDate'
  })
    .populate({
      path: 'release',
      match: { published: true },
      model: Release,
      options: { lean: true },
      select: 'artistName artwork releaseTitle trackList._id trackList.trackTitle'
    })
    .exec();

  res.send(userFavourites);
});

router.post('/favourites/:releaseId', requireLogin, async (req, res) => {
  const { releaseId: release } = req.params;
  const user = req.user._id;
  const favourite = await Favourite.create({ release, dateAdded: Date.now(), user });
  res.send(favourite.toJSON());
});

router.delete('/favourites/:releaseId', requireLogin, async (req, res) => {
  const { releaseId: release } = req.params;
  const user = req.user._id;
  await Favourite.findOneAndDelete({ release, user });
  res.end();
});

router.get('/plays', requireLogin, async (req, res) => {
  try {
    const userId = req.user._id;
    const releases = await Release.aggregate([
      { $match: { user: userId } },
      { $lookup: { from: 'plays', localField: '_id', foreignField: 'release', as: 'plays' } },
      { $project: { sum: { $size: '$plays' } } }
    ]).exec();

    res.send(releases);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

router.get('/release/:releaseId', requireLogin, async (req, res) => {
  const release = await Release.findById(req.params.releaseId, '-__v', { lean: true }).exec();
  res.send(release);
});

router.get('/releases/', requireLogin, async (req, res) => {
  const releases = await Release.find({ user: req.user._id }, '-__v', { lean: true, sort: '-releaseDate' }).exec();
  res.send(releases);
});

router.get('/releases/favourites', requireLogin, async (req, res) => {
  try {
    const userId = req.user._id;
    const releases = await Release.aggregate([
      { $match: { user: userId } },
      { $lookup: { from: 'favourites', localField: '_id', foreignField: 'release', as: 'favourites' } },
      { $project: { sum: { $size: '$favourites' } } }
    ]).exec();

    res.send(releases);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

router.get('/sales', requireLogin, async (req, res) => {
  const releases = await Release.find({ user: req.user._id });

  const sales = await Sale.aggregate([
    { $match: { release: { $in: releases.map(({ _id }) => _id) } } },
    { $group: { _id: '$release', sum: { $sum: 1 } } },
    { $sort: { sum: -1 } }
  ]).exec();

  res.send(sales);
});

router.post('/transactions', requireLogin, async (req, res) => {
  try {
    const { releaseId, paymentHash } = req.body;
    const { price } = req.session;
    const transations = await getUserTransactions({ user: req.user, releaseId, paymentHash, price });
    res.send(transations);
  } catch (error) {
    if (error.data) return res.status(500).send({ error: error.data.message });
    res.status(500).send({ error: error.message });
  }
});

router.get('/wishlist/', requireLogin, async (req, res) => {
  const userWishList = await Wish.find({ user: req.user._id }, '', { lean: true, sort: '-release.releaseDate' })
    .populate({
      path: 'release',
      match: { published: true },
      model: Release,
      options: { lean: true },
      select: 'artistName artwork releaseTitle trackList._id trackList.trackTitle'
    })
    .exec();

  res.send(userWishList);
});

router.post('/wishlist/:releaseId', requireLogin, async (req, res) => {
  const { releaseId: release } = req.params;
  const user = req.user._id;
  const wishlistItem = await Wish.create({ release, dateAdded: Date.now(), user });
  res.send(wishlistItem.toJSON());
});

router.delete('/wishlist/:releaseId', requireLogin, async (req, res) => {
  const { releaseId: release } = req.params;
  const user = req.user._id;
  await Wish.findOneAndDelete({ release, user });
  res.end();
});

module.exports = router;
