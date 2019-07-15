const aws = require('aws-sdk');
const crypto = require('crypto');
const mongoose = require('mongoose');
const nem = require('nem-sdk').default;
const {
  AWS_REGION,
  BUCKET_IMG,
  BUCKET_OPT,
  BUCKET_SRC
} = require('./constants');
const releaseOwner = require('../middlewares/releaseOwner');
const requireLogin = require('../middlewares/requireLogin');
const { getXemPrice } = require('./utils');

const Artist = mongoose.model('artists');
const Release = mongoose.model('releases');
const User = mongoose.model('users');
aws.config.update({ region: AWS_REGION });

module.exports = app => {
  // Add New Release
  app.post('/api/release', requireLogin, async (req, res) => {
    const user = await User.findById(req.user.id);
    const releases = await Release.find({ user: req.user.id });

    if (!user.nemAddress || !user.nemAddressVerified) {
      res.send({
        warning:
          'Please add and verify your NEM address first. You will need credit to add a release.'
      });
      return;
    }

    if (user.credit <= releases.length) {
      res.send({
        warning:
          'Sorry, you don\u2019t have enough credit to add a new release. Please top up first.'
      });
      return;
    }

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
        Prefix: `mp4/${releaseId}`
      };
      const s3OptData = await s3.listObjectsV2(listOptParams).promise();

      let deleteS3Opt;
      if (s3OptData.Contents.length) {
        const deleteOptParams = {
          Bucket: BUCKET_OPT,
          Delete: {
            Objects: s3OptData.Contents.map(track => ({
              Key: track.Key
            }))
          }
        };
        deleteS3Opt = s3.deleteObjects(deleteOptParams).promise();
      }

      // Delete mpd
      const listMpdParams = {
        Bucket: BUCKET_OPT,
        Prefix: `mpd/${releaseId}`
      };
      const s3MpdData = await s3.listObjectsV2(listMpdParams).promise();

      let deleteS3Mpd;
      if (s3MpdData.Contents.length) {
        const deleteMpdParams = {
          Bucket: BUCKET_OPT,
          Key: s3MpdData.Contents[0].Key
        };
        deleteS3Mpd = await s3.deleteObject(deleteMpdParams).promise();
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
        deleteS3Mpd,
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
      const xemPriceUsd = await getXemPrice();
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
          release.updateOne({ published: false }).exec();
          throw new Error(
            'Please add a valid NEM address to your account before publishing this release (\'Payment\' tab).'
          );
        }

        if (!release.artwork) {
          release.updateOne({ published: false }).exec();
          throw new Error(
            'Please ensure the release has artwork uploaded before publishing.'
          );
        }

        if (!release.trackList.length) {
          release.updateOne({ published: false }).exec();
          throw new Error(
            'Please add at least one track to the release (with audio), before publishing.'
          );
        }

        if (release.trackList.some(track => !track.hasAudio)) {
          release.updateOne({ published: false }).exec();
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
      tags,
      trackList
    } = req.body;

    const release = await Release.findById(releaseId).select('-__v');

    // Unfortunately we must be explicit with document updates as non-form items such as track times will be overwritten due to shallow object merging.

    release.artistName = artistName;
    release.catNumber = catNumber;
    release.credits = credits;
    release.info = info;
    release.price = price;
    release.recordLabel = recordLabel;
    release.releaseDate = releaseDate;
    release.releaseTitle = releaseTitle;
    release.tags = tags;
    release.pLine.year = pLine && pLine.year ? pLine.year : undefined;
    release.pLine.owner = pLine && pLine.owner ? pLine.owner : undefined;
    release.cLine.year = cLine && cLine.year ? cLine.year : undefined;
    release.cLine.owner = cLine && cLine.owner ? cLine.owner : undefined;
    release.trackList.forEach((track, index) => {
      track.trackTitle = trackList[index].trackTitle;
      track.hasAudio = trackList[index].hasAudio;
    });
    const updatedRelease = await release.save();

    // Add artist to Artist model.
    const artist = await Artist.findOneAndUpdate(
      { user: req.user._id, name: artistName },
      {},
      { new: true, upsert: true }
    );

    // Add release ID to artist if it doesn't already exist.
    if (!artist.releases.some(id => id.equals(release._id))) {
      artist.releases.push(release._id);
      artist.save();
      release.updateOne({ artist: artist._id });
    }

    // Add artist ID to user account.
    User.findOneAndUpdate(
      { _id: req.user._id, artists: { $ne: artist._id } },
      { $push: { artists: artist._id } }
    )
      .exec()
      .then(res.send(updatedRelease))
      .catch(error => res.status(500).send({ error: error.message }));
  });
};
