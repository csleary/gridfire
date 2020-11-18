const mongoose = require('mongoose');
const slugify = require('slugify');
const Artist = mongoose.model('artists');

const createArtist = async (artistName, userId, suffix = '') =>
  Artist.create(
    [
      {
        name: artistName,
        slug: slugify(`${artistName}${suffix}`, { lower: true }),
        user: userId,
        dateCreated: Date.now()
      }
    ],
    { fields: { _id: 1 }, lean: true, new: true }
  ).catch(error => {
    if (error.code === 11000 && error.keyPattern.slug === 1) {
      let newSuffix;

      if (!suffix) {
        newSuffix = '-1';
      } else {
        newSuffix = `-${Number.parseInt(suffix.split('-').pop()) + 1}`;
      }

      return createArtist(artistName, userId, newSuffix);
    }

    throw error;
  });

module.exports = { createArtist };
