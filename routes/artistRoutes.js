const mongoose = require('mongoose');
const requireLogin = require('../middlewares/requireLogin');

const Artist = mongoose.model('artists');
const Release = mongoose.model('releases');

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
      const { name, slug, biography, links } = req.body;

      // If slug string length is zero, set it to null to satisfy the unique index.
      const { releases, ...rest } = await Artist.findOneAndUpdate(
        { _id: req.params.artistId, user: userId },
        {
          name,
          slug: slug && slug.length === 0 ? null : slug,
          biography,
          links: links.slice(0, 10)
        },
        { fields: { __v: 0 }, lean: true, new: true }
      ).exec();

      await Release.updateMany({ _id: { $in: releases }, user: userId }, { artistName: name }).exec();
      res.send({ ...rest });
    } catch (error) {
      if (error.codeName === 'DuplicateKey') {
        return res.send({
          error: 'Save failed. This artist slug is already in use. Please try another.',
          name: 'slug',
          value: 'This slug is in use. Please try another.'
        });
      }

      res.status(500).send({ error: error.message });
    }
  });

  app.patch('/api/artist/:artistId/link', requireLogin, async (req, res) => {
    try {
      const userId = req.user._id;

      const updated = await Artist.findOneAndUpdate(
        { _id: req.params.artistId, user: userId },
        { $addToSet: { links: { title: '', uri: '' } } },
        { fields: { links: 1 }, lean: true, new: true }
      ).exec();

      res.send(updated);
    } catch (error) {
      res.status(500).send({ error: error.message });
    }
  });
};
