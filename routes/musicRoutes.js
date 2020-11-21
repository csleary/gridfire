const aws = require('aws-sdk');
const mongoose = require('mongoose');
const requireLogin = require('../middlewares/requireLogin');
const { AWS_REGION } = require('../config/constants');
const Artist = mongoose.model('artists');
const Favourite = mongoose.model('favourites');
const Release = mongoose.model('releases');
const Sale = mongoose.model('sales');
const Wish = mongoose.model('wishlist');
aws.config.update({ region: AWS_REGION });

module.exports = app => {
  // Fetch user collection
  app.get('/api/user/collection/', requireLogin, async (req, res) => {
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

  // Fetch user favourites
  app.get('/api/user/favourites/', requireLogin, async (req, res) => {
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

  // Fetch user wish list
  app.get('/api/user/wish-list/', requireLogin, async (req, res) => {
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

  // Fetch artist catalogue
  app.get('/api/catalogue/:artistIdOrSlug', async (req, res) => {
    const { artistIdOrSlug } = req.params;
    const { isValidObjectId, Types } = mongoose;
    const { ObjectId } = Types;

    const [catalogue] = await Artist.aggregate([
      { $match: isValidObjectId(artistIdOrSlug) ? { _id: ObjectId(artistIdOrSlug) } : { slug: artistIdOrSlug } },
      { $lookup: { from: 'releases', localField: '_id', foreignField: 'artist', as: 'releases' } },
      {
        $project: {
          name: 1,
          slug: 1,
          biography: 1,
          links: 1,
          releases: {
            $filter: {
              input: '$releases',
              as: 'release',
              cond: { $eq: ['$$release.published', true] }
            }
          }
        }
      },
      { $sort: { 'releases.releaseDate': -1 } }
    ]).exec();

    res.send(catalogue);
  });

  // Fetch site catalogue
  app.get('/api/catalogue/', async (req, res) => {
    try {
      const { catalogueLimit, catalogueSkip, sortPath, sortOrder } = req.query;

      const releases = await Release.find({ published: true }, '-__v', {
        skip: parseInt(catalogueSkip),
        limit: parseInt(catalogueLimit)
      }).sort({ [sortPath]: sortOrder });

      res.send(releases);
    } catch (error) {
      res.status(500).send({ error: 'Music catalogue could not be fetched.' });
    }
  });

  // Fetch site catalogue count
  app.get('/api/catalogue/count', async (req, res) => {
    const count = await Release.count();
    res.send({ count });
  });

  // Fetch user releases play counts
  app.get('/api/plays', requireLogin, async (req, res) => {
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

  // Fetch release sales figures
  app.get('/api/sales', requireLogin, async (req, res) => {
    const releases = await Release.find({ user: req.user._id });

    const sales = await Sale.aggregate([
      { $match: { release: { $in: releases.map(({ _id }) => _id) } } },
      { $group: { _id: '$release', sum: { $sum: 1 } } },
      { $sort: { sum: -1 } }
    ]).exec();

    res.send(sales);
  });

  // Fetch single user release
  app.get('/api/user/release/:releaseId', requireLogin, async (req, res) => {
    const release = await Release.findById(req.params.releaseId, '-__v', { lean: true }).exec();
    res.send(release);
  });

  // Fetch user releases
  app.get('/api/user/releases/', requireLogin, async (req, res) => {
    const releases = await Release.find({ user: req.user._id }, '-__v', { lean: true, sort: '-releaseDate' }).exec();
    res.send(releases);
  });

  // Fetch user releases fav counts
  app.get('/api/user/releases/favourites', requireLogin, async (req, res) => {
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

  // Search releases
  app.get('/api/search', async (req, res) => {
    const { searchQuery } = req.query;
    const results = await Release.find(
      { published: true, $text: { $search: searchQuery } },
      'artistName artwork releaseTitle trackList._id trackList.trackTitle',
      { lean: true, limit: 50 }
    ).exec();

    res.send(results);
  });

  // Add release to user favourites
  app.post('/api/user/favourites/:releaseId', requireLogin, async (req, res) => {
    const { releaseId: release } = req.params;
    const user = req.user._id;
    const favourite = await Favourite.create({ release, dateAdded: Date.now(), user });
    res.send(favourite.toJSON());
  });

  // Remove release from user favourites
  app.delete('/api/user/favourites/:releaseId', requireLogin, async (req, res) => {
    const { releaseId: release } = req.params;
    const user = req.user._id;
    await Favourite.findOneAndDelete({ release, user });
    res.end();
  });

  // Add release to user wish list
  app.post('/api/user/wish-list/:releaseId', requireLogin, async (req, res) => {
    const { releaseId: release } = req.params;
    const user = req.user._id;
    const wishlistItem = await Wish.create({ release, dateAdded: Date.now(), user });
    res.send(wishlistItem.toJSON());
  });

  // Remove release from user wish list
  app.delete('/api/user/wish-list/:releaseId', requireLogin, async (req, res) => {
    const { releaseId: release } = req.params;
    const user = req.user._id;
    await Wish.findOneAndDelete({ release, user });
    res.end();
  });
};
