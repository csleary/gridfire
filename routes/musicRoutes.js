const aws = require('aws-sdk');
const mongoose = require('mongoose');
const requireLogin = require('../middlewares/requireLogin');
const { AWS_REGION } = require('../config/constants');
const Artist = mongoose.model('artists');
const Release = mongoose.model('releases');
const Sale = mongoose.model('sales');
const User = mongoose.model('users');
aws.config.update({ region: AWS_REGION });

module.exports = app => {
  // Fetch user collection
  app.get('/api/user/collection/', requireLogin, async (req, res) => {
    const { purchases } = req.user;
    const releaseIds = purchases.map(release => release.releaseId);
    const releases = await Release.find({ _id: { $in: releaseIds } }, '-__v', {
      lean: true,
      sort: '-purchaseDate'
    }).exec();
    res.send(releases);
  });

  // Fetch user favourites
  app.get('/api/user/favourites/', requireLogin, async (req, res) => {
    const user = await User.findById(req.user._id, 'favourites', { lean: true }).exec();
    const releaseIds = user.favourites.map(rel => rel.releaseId);
    const userFavourites = await Release.find({ _id: { $in: releaseIds } }, '-__v', {
      lean: true,
      sort: '-releaseDate'
    }).exec();
    res.send(userFavourites);
  });

  // Fetch user wish list
  app.get('/api/user/wish-list/', requireLogin, async (req, res) => {
    const user = await User.findById(req.user._id, 'wishList', { lean: true }).exec();
    const releaseIds = user.wishList.map(rel => rel.releaseId);
    const userWishList = await Release.find({ _id: { $in: releaseIds } }, '-__v', {
      lean: true,
      sort: '-releaseDate'
    }).exec();
    res.send(userWishList);
  });

  // Fetch artist catalogue
  app.get('/api/catalogue/:artist', async (req, res) => {
    const { artist } = req.params;

    const catalogue = await Artist.findById(artist)
      .populate({
        path: 'releases',
        match: { published: true },
        model: Release,
        options: { lean: true, sort: '-releaseDate' }
      })
      .exec();

    res.send(catalogue);
  });

  // Fetch site catalogue
  app.get('/api/catalogue/', async (req, res) => {
    const { catalogueLimit, catalogueSkip, sortPath, sortOrder } = req.query;

    const releases = await Release.find({ published: true }, '-__v', {
      skip: parseInt(catalogueSkip),
      limit: parseInt(catalogueLimit)
    }).sort({ [sortPath]: sortOrder });

    res.send(releases);
  });

  // Fetch site catalogue count
  app.get('/api/catalogue/count', async (req, res) => {
    const count = await Release.count();
    res.send({ count });
  });

  // Fetch release sales figures
  app.get('/api/sales', requireLogin, async (req, res) => {
    const releases = await Release.find({ user: req.user._id });
    const releaseIds = releases.map(release => release._id);
    const sales = await Sale.find({ releaseId: { $in: releaseIds } }, '-__v', {
      lean: true
    }).exec();
    res.send(sales);
  });

  // Fetch single user release
  app.get('/api/user/release/:releaseId', requireLogin, async (req, res) => {
    const release = await Release.findById(req.params.releaseId, '-__v', { lean: true }).exec();
    res.send(release);
  });

  // Fetch user releases
  app.get('/api/user/releases/', requireLogin, async (req, res) => {
    const releases = await Release.find({ user: req.user._id }, '-__v', {
      lean: true,
      sort: '-releaseDate'
    }).exec();
    res.send(releases);
  });

  // Fetch user releases fav counts
  app.get('/api/user/releases/favourites', requireLogin, async (req, res) => {
    try {
      const userId = req.user._id;
      const releases = await Release.find({ user: userId }, '_id', { lean: true }).exec();

      const counts = await User.aggregate([
        { $match: { 'favourites.releaseId': { $in: releases.map(rel => rel._id) } } },
        { $group: { _id: { releaseId: '$favourites.releaseId' } } },
        { $unwind: '$_id.releaseId' },
        { $group: { _id: '$_id.releaseId', favs: { $sum: 1 } } }
      ]).exec();

      res.send({ counts });
    } catch (error) {
      res.status(500).send({ error: error.message });
    }
  });

  // Search releases
  app.get('/api/search', async (req, res) => {
    const { searchQuery } = req.query;
    const results = await Release.find({ published: true, $text: { $search: searchQuery } }, '-__v', {
      lean: true,
      limit: 50
    }).exec();

    res.send(results);
  });

  // Add release to user favourites
  app.post('/api/user/favourite/:releaseId', requireLogin, async (req, res) => {
    const { releaseId } = req.params;
    const userId = req.user._id;
    const favExists = await User.exists({ _id: userId, 'favourites.releaseId': releaseId });

    const update = favExists
      ? { $pull: { favourites: { releaseId } } }
      : { $addToSet: { favourites: { releaseId, dateAdded: Date.now() } } };

    const user = await User.findByIdAndUpdate(userId, update, { new: true, select: { favourites: 1 } }).exec();
    res.send(user.toJSON().favourites);
  });

  // Add release to user wish list
  app.post('/api/user/wish-list/:releaseId', requireLogin, async (req, res) => {
    const { releaseId } = req.params;
    const userId = req.user._id;
    const releaseExists = await User.exists({ _id: userId, 'wishList.releaseId': releaseId });

    const update = releaseExists
      ? { $pull: { wishList: { releaseId } } }
      : { $addToSet: { wishList: { releaseId, dateAdded: Date.now() } } };

    const user = await User.findByIdAndUpdate(userId, update, { new: true, select: { wishList: 1 } }).exec();
    res.send(user.toJSON().wishList);
  });
};
