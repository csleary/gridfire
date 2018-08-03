const aws = require('aws-sdk');
const mongoose = require('mongoose');
const requireLogin = require('../middlewares/requireLogin');
const { AWS_REGION } = require('./constants');

const Artist = mongoose.model('artists');
const Release = mongoose.model('releases');
const Sale = mongoose.model('sales');
aws.config.update({ region: AWS_REGION });

module.exports = app => {
  // Fetch User Collection
  app.get('/api/collection/', requireLogin, async (req, res) => {
    const { purchases } = req.user;
    const releaseIds = purchases.map(release => release.releaseId);
    const releases = await Release.find({ _id: { $in: releaseIds } }).sort(
      '-releaseDate'
    );
    res.send(releases);
  });

  // Fetch Artist Catalogue
  app.get('/api/catalogue/:artist', async (req, res) => {
    const { artist } = req.params;

    const catalogue = await Artist.findById(artist).populate({
      path: 'releases',
      match: { published: true },
      model: Release,
      options: {
        sort: { releaseDate: -1 }
      }
    });
    res.send(catalogue);
  });

  // Fetch Site Catalogue
  app.get('/api/catalogue', async (req, res) => {
    const releases = await Release.find({ published: true })
      // .skip(0) // TODO: Add param to fetch the next batch.
      .limit(16)
      .sort('-dateCreated');
    res.send(releases);
  });

  // Fetch Release Sales Figures
  app.get('/api/sales', requireLogin, async (req, res) => {
    const releases = await Release.find({ user: req.user.id });
    const releaseIds = releases.map(release => release._id);
    const sales = await Sale.find({ releaseId: { $in: releaseIds } });
    res.send(sales);
  });

  // Fetch Single User Release
  app.get('/api/user/release/:releaseId', requireLogin, async (req, res) => {
    const release = await Release.findById(req.params.releaseId);
    res.send(release);
  });

  // Fetch User Releases
  app.get('/api/user/releases/', requireLogin, async (req, res) => {
    const releases = await Release.find({ user: req.user.id }).sort(
      '-releaseDate'
    );
    res.send(releases);
  });

  // Search releases
  app.get('/api/search', async (req, res) => {
    const { searchQuery } = req.query;
    const results = await Release.find({
      $text: { $search: searchQuery }
    }).limit(50);
    res.send(results);
  });
};
