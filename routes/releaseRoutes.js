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
    const release = await new Release({
      user: req.user.id,
      dateCreated: Date.now()
    });
    release
      .save()
      .then(newRelease => res.send(newRelease))
      .catch(error => res.status(500).send({ error }));
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
      const listS3Src = s3.listObjectsV2(listSrcParams).promise();
      const s3SrcData = await listS3Src;

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
        deleteS3Src;
      }

      // Delete streaming audio
      const listOptParams = {
        Bucket: BUCKET_OPT,
        Prefix: `m4a/${releaseId}`
      };
      const listS3Opt = s3.listObjectsV2(listOptParams).promise();
      const s3OptData = await listS3Opt;

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
        deleteS3Opt;
      }

      // Delete art from S3
      const listImgParams = {
        Bucket: BUCKET_IMG,
        Prefix: `${releaseId}`
      };
      const listS3Img = s3.listObjectsV2(listImgParams).promise();
      const s3ImgData = await listS3Img;

      let deleteS3Img;
      if (s3ImgData.Contents.length) {
        const deleteImgParams = {
          Bucket: BUCKET_IMG,
          Key: s3ImgData.Contents[0].Key
        };
        deleteS3Img = s3.deleteObject(deleteImgParams).promise();
        deleteS3Img;
      }

      Promise.all([
        deleteRelease,
        deleteFromArtist,
        deleteArtist,
        deleteArtistFromUser,
        listS3Src,
        deleteS3Src,
        listS3Opt,
        deleteS3Opt,
        listS3Img,
        deleteS3Img
      ])
        .then(values => res.send(values[0]._id))
        .catch(error => res.status(500).send({ error }));
    }
  );

  // Fetch Release
  app.get('/api/release/:releaseId', async (req, res) => {
    const release = await Release.findOne({ _id: req.params.releaseId });
    if (
      !release.published &&
      release.user.toString() !== req.user._id.toString()
    ) {
      res.send({ error: 'Release currently unavailable.' });
    } else {
      const artist = await User.findOne({ _id: release.user });
      const paymentInfo = {
        paymentAddress: nem.utils.format.address(artist.nemAddress)
      };
      res.send({ release, paymentInfo });
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

        if (
          !release.artwork ||
          !release.trackList.length ||
          release.trackList.some(track => !track.hasAudio)
        ) {
          release.update({ published: false }).exec();
          throw new Error(
            'Please ensure your release has artwork, and that all tracks have audio uploaded, before publishing.'
          );
        }

        if (!nemAddress || !nem.model.address.isValid(nemAddress)) {
          release.update({ published: false }).exec();
          throw new Error(
            'Please add a valid NEM address to your account before publishing this release (payment tab).'
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
    const releaseId = req.body._id;
    const {
      artistName,
      catNumber,
      cLine,
      credits,
      info,
      pLine,
      price,
      recordLabel,
      releaseDate,
      releaseTitle,
      trackList
    } = req.body;

    const release = await Release.findById(releaseId);
    release.artistName = artistName;
    release.catNumber = catNumber;
    release.credits = credits;
    release.info = info;
    release.price = price;
    release.recordLabel = recordLabel;
    release.releaseDate = releaseDate;
    release.releaseTitle = releaseTitle;
    release.pLine.year = pLine && pLine.year;
    release.pLine.owner = pLine && pLine.owner;
    release.cLine.year = cLine && cLine.year;
    release.cLine.owner = cLine && cLine.owner;
    release.trackList.forEach((track, index) => {
      track.trackTitle = trackList[index].trackTitle;
    });

    release
      .save()
      // Add artist to Artist model.
      .then(async updatedRelease => {
        const artist = await Artist.findOneAndUpdate(
          { user: req.user._id, name: artistName },
          {},
          { new: true, upsert: true }
        );

        // Add release ID to artist if it doesn't already exist.
        if (!artist.releases.some(id => id.equals(updatedRelease._id))) {
          artist
            .update({ $push: { releases: updatedRelease._id } })
            .exec(() => release.update({ artist: artist._id }).exec());
        }
        return artist;
      })

      // Add artist ID to user account.
      .then(async updatedArtist =>
        User.findOneAndUpdate(
          { _id: req.user._id, artists: { $ne: updatedArtist._id } },
          { $push: { artists: updatedArtist._id } }
        )
      )
      .then(() => res.send(release))
      .catch(error => res.status(500).send({ error: error.message }));
  });
};
