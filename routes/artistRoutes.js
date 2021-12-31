import requireLogin from '../middlewares/requireLogin.js';
import express from 'express';
import slugify from 'slugify';
import Artist from '../models/Artist.js';
import Release from '../models/Release.js';
const router = express.Router();

router.get('/', requireLogin, async (req, res) => {
  try {
    const userId = req.user._id;
    const artists = await Artist.find({ user: userId }, '-__v', { lean: true }).exec();
    res.send(artists);
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
});

router.post('/:artistId', requireLogin, async (req, res) => {
  try {
    const userId = req.user._id;
    const { name, slug, biography, links } = req.body;

    // If slug string length is zero, set it to null to satisfy the unique index.
    const artist = await Artist.findOneAndUpdate(
      { _id: req.params.artistId, user: userId },
      {
        name,
        slug: slug && slug.length === 0 ? null : slugify(slug, { lower: true, strict: true }),
        biography,
        links: links.slice(0, 10)
      },
      { fields: { __v: 0 }, lean: true, new: true }
    ).exec();

    await Release.updateMany({ artist: req.params.artistId, user: userId }, { artistName: name }).exec();
    res.send(artist);
  } catch (error) {
    if (error.codeName === 'DuplicateKey') {
      return res.send({
        error: 'Save failed. This artist slug is already in use. Please try another.',
        name: 'slug',
        value: 'This slug is in use. Please try another.'
      });
    }

    res.status(400).send({ error: error.message });
  }
});

router.patch('/:artistId/link', requireLogin, async (req, res) => {
  try {
    const userId = req.user._id;
    const artist = await Artist.findOne({ _id: req.params.artistId, user: userId }, 'links').exec();
    const newLink = artist.links.create();
    res.send(newLink);
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
});

export default router;
