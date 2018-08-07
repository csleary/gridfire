const aws = require('aws-sdk');
const mongoose = require('mongoose');
const nem = require('nem-sdk').default;
const crypto = require('crypto');
const releaseOwner = require('../middlewares/releaseOwner');
const requireLogin = require('../middlewares/requireLogin');
const utils = require('./utils');
const { AWS_REGION } = require('./constants');
const { BUCKET_IMG } = require('./constants');
const { BUCKET_SRC } = require('./constants');
const { BUCKET_OPT } = require('./constants');

const Artist = mongoose.model('artists');
const Release = mongoose.model('releases');
const User = mongoose.model('users');
aws.config.update({ region: AWS_REGION });

module.exports = app => {
  // Add New Release
  // Possibly check for upload tokens/credit.
  app.post('/api/release', requireLogin, async (req, res) => {
    const release = await new Release(
      {
        user: req.user.id,
        dateCreated: Date.now()
      },
      '-__v'
    );
    release
      .save()
      .then(res.send(release))
      .catch(error => res.status(500).send({ error: error.message }));
  });

  // Delete Release
  app.delete(
    '/api/release/:releaseId',
    requireLogin,
    releaseOwner,
    async (req, res) => {
      const { releaseId } = req.params;
      const release = res.locals.release;

      // Delete from db
      let deleteArtist;
      let deleteArtistFromUser;
      const deleteRelease = await Release.findByIdAndRemove(releaseId);
      const deleteFromArtist = await Artist.findByIdAndUpdate(
        release.artist,
        {
          $pull: { releases: releaseId }
        },
        { new: true }
      ).then(async artist => {
        if (artist && !artist.releases.length) {
          deleteArtistFromUser = await User.findByIdAndUpdate(req.user._id, {
            $pull: { artists: artist._id }
          }).then(async () => {
            deleteArtist = await Artist.findByIdAndRemove(artist._id);
          });
        }
      });

      // Delete audio from S3
      const s3 = new aws.S3();

      // Delete source audio
      const listSrcParams = {
        Bucket: BUCKET_SRC,
        Prefix: `${releaseId}`
      };
      const s3SrcData = await s3.listObjectsV2(listSrcParams).promise();

      let deleteS3Src;
      if (s3SrcData.Contents.length) {
        const deleteSrcParams = {
          Bucket: BUCKET_SRC,
          Delete: {
            Objects: s3SrcData.Contents.map(track => ({
              Key: track.Key
            }))
          }
        };
        deleteS3Src = s3.deleteObjects(deleteSrcParams).promise();
      }

      // Delete streaming audio
      const listOptParams = {
        Bucket: BUCKET_OPT,
        Prefix: `m4a/${releaseId}`
      };
      const s3OptData = await s3.listObjectsV2(listOptParams).promise();

      let deleteS3Opt;
      if (s3OptData.Contents.length) {
        const deleteImgParams = {
          Bucket: BUCKET_OPT,
          Delete: {
            Objects: s3OptData.Contents.map(track => ({
              Key: track.Key
            }))
          }
        };
        deleteS3Opt = s3.deleteObjects(deleteImgParams).promise();
      }

      // Delete art from S3
      const listImgParams = {
        Bucket: BUCKET_IMG,
        Prefix: `${releaseId}`
      };
      const s3ImgData = await s3.listObjectsV2(listImgParams).promise();

      let deleteS3Img;
      if (s3ImgData.Contents.length) {
        const deleteImgParams = {
          Bucket: BUCKET_IMG,
          Key: s3ImgData.Contents[0].Key
        };
        deleteS3Img = s3.deleteObject(deleteImgParams).promise();
      }

      Promise.all([
        deleteRelease,
        deleteFromArtist,
        deleteArtist,
        deleteArtistFromUser,
        deleteS3Src,
        deleteS3Opt,
        deleteS3Img
      ])
        .then(values => res.send(values[0]._id))
        .catch(error => res.status(500).send({ error }));
    }
  );

  // Fetch Release
  app.get('/api/release/:releaseId', async (req, res) => {
    try {
      const release = await Release.findOne(
        { _id: req.params.releaseId },
        '-__v'
      );

      if (!release.published && !release.user.equals(req.user._id)) {
        throw new Error('This release is currently unavailable.');
      }

      const artist = await User.findOne({ _id: release.user });
      const paymentInfo = {
        paymentAddress: nem.utils.format.address(artist.nemAddress)
      };
      res.send({ release, paymentInfo });
    } catch (error) {
      res.status(500).send({ error: error.message });
    }
  });

  // Purchase Release
  app.get('/api/purchase/:releaseId', requireLogin, async (req, res) => {
    try {
      req.session.price = null;
      const { releaseId } = req.params;
      const release = await Release.findById(releaseId);
      const owner = await User.findById(release.user);
      const customerIdHash = req.user.auth.idHash;
      const xemPriceUsd = await utils.getXemPrice();
      const price = (release.price / xemPriceUsd).toFixed(6); // Convert depending on currency used.
      req.session.price = price;

      if (!owner.nemAddress) {
        const error = 'No NEM payment address found. 😞';
        const paymentInfo = { paymentAddress: null, paymentHash: null };
        res.send({ error, release, paymentInfo, price });
        return;
      }

      const hash = crypto.createHash('sha256');
      const paymentHash = hash
        .update(release._id.toString())
        .update(customerIdHash)
        .digest('hex')
        .substring(0, 31);

      const paymentInfo = {
        paymentAddress: nem.utils.format.address(owner.nemAddress),
        paymentHash
      };
      res.send({ release, paymentInfo, price });
    } catch (error) {
      res.status(500).send({ error: error.message });
    }
  });

  // Toggle Release Status
  app.patch(
    '/api/release/:releaseId',
    requireLogin,
    releaseOwner,
    async (req, res) => {
      try {
        const release = res.locals.release;
        const { nemAddress } = req.user;

        if (!nemAddress || !nem.model.address.isValid(nemAddress)) {
          release.update({ published: false }).exec();
          throw new Error(
            "Please add a valid NEM address to your account before publishing this release ('Payment' tab)."
          );
        }

        if (!release.artwork) {
          release.update({ published: false }).exec();
          throw new Error(
            'Please ensure the release has artwork uploaded before publishing.'
          );
        }

        if (!release.trackList.length) {
          release.update({ published: false }).exec();
          throw new Error(
            'Please add at least one track to the release (with audio), before publishing.'
          );
        }

        if (release.trackList.some(track => !track.hasAudio)) {
          release.update({ published: false }).exec();
          throw new Error(
            'Please ensure that all tracks have audio uploaded before publishing.'
          );
        }

        release.published = !release.published;
        release.save().then(updatedRelease => res.send(updatedRelease));
      } catch (error) {
        res.status(500).send({ error: error.message });
      }
    }
  );

  // Update Release
  app.put('/api/release', requireLogin, async (req, res) => {
    const update = req.body;
    const releaseId = update._id;

    const release = await Release.findByIdAndUpdate(releaseId, update, {
      new: true
    }).select('-__v');

    // Add artist to Artist model.
    const { artistName } = release;

    const artist = await Artist.findOneAndUpdate(
      { user: req.user._id, name: artistName },
      {},
      { new: true, upsert: true }
    );

    // Add release ID to artist if it doesn't already exist.
    if (!artist.releases.some(id => id.equals(release._id))) {
      artist
        .update({ $push: { releases: release._id } })
        .exec(() => release.update({ artist: artist._id }).exec());
    }

    // Add artist ID to user account.
    User.findOneAndUpdate(
      { _id: req.user._id, artists: { $ne: artist._id } },
      { $push: { artists: artist._id } }
    )
      .exec()
      .then(res.send(release))
      .catch(error => res.status(500).send({ error: error.message }));
  });
};
