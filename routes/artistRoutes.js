const mongoose = require('mongoose');
const requireLogin = require('../middlewares/requireLogin');

const Artist = mongoose.model('artists');
// const Release = mongoose.model('releases');
// const User = mongoose.model('users');

module.exports = app => {
  app.get('/api/artists', requireLogin, async (req, res) => {
    try {
      const userId = req.user._id;
      const artists = await Artist.find({ user: userId }, '-__v', { lean: true }).exec();
      res.send(artists);
    } catch (error) {
      res.status(500).send({ error: error.message });
    }
  });

  app.post('/api/artist/:artistId', requireLogin, async (req, res) => {
    try {
      const userId = req.user._id;
      const { biography, links } = req.body;

      const updated = await Artist.findOneAndUpdate(
        { _id: req.params.artistId, user: userId },
        { biography, links },
        { fields: { biography: 1, links: 1, name: 1 }, lean: true, new: true }
      ).exec();

      res.send(updated);
    } catch (error) {
      res.status(500).send({ error: error.message });
    }
  });

  app.patch('/api/artist/:artistId/link', requireLogin, async (req, res) => {
    try {
      const userId = req.user._id;

      const updated = await Artist.findOneAndUpdate(
        { _id: req.params.artistId, user: userId },
        { $addToSet: { links: { title: '', uri: '' } } },
        { fields: { biography: 1, links: 1, name: 1 }, lean: true, new: true }
      ).exec();

      res.send(updated);
    } catch (error) {
      res.status(500).send({ error: error.message });
    }
  });
};
