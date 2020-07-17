const aws = require('aws-sdk');
const crypto = require('crypto');
const mongoose = require('mongoose');
const nem = require('nem-sdk').default;
const { AWS_REGION, BUCKET_IMG, BUCKET_OPT, BUCKET_SRC } = require('../config/constants');
const releaseOwner = require('../middlewares/releaseOwner');
const requireLogin = require('../middlewares/requireLogin');
const { fetchXemPrice, fetchXemPriceBinance } = require('../controllers/nemController');

const Artist = mongoose.model('artists');
const Release = mongoose.model('releases');
const User = mongoose.model('users');
aws.config.update({ region: AWS_REGION });

module.exports = app => {
  // Add New Release
  app.post('/api/release', requireLogin, async (req, res) => {
    try {
      const userId = req.user._id;
      const user = await User.findById(userId, {}, { lean: true }).exec();
      const releases = await Release.find({ user: userId }, {}, { lean: true }).exec();

      if (!user.nemAddress || !user.nemAddressVerified) {
        res.send({
          warning: 'Please add and verify your NEM address first. You will need credit to add a release.'
        });
        return;
      }

      if (user.credits <= releases.length) {
        res.send({
          warning: 'Sorry, you don\u2019t have enough credit to add a new release. Please add more nemp3 credits first.'
        });
        return;
      }

      const release = await Release.create({ user: userId, dateCreated: Date.now() });
      res.send(release.toJSON());
    } catch (error) {
      res.status(500).send({ error: error.message });
    }
  });

  // Delete Release
  app.delete('/api/release/:releaseId', requireLogin, releaseOwner, async (req, res) => {
    try {
      const { releaseId } = req.params;
      const release = res.locals.release;

      // Delete from db
      const deleteRelease = Release.findByIdAndRemove(releaseId).exec();

      const artistPullRelease = await Artist.findByIdAndUpdate(
        release.artist,
        { $pull: { releases: releaseId } },
        { lean: true, new: true }
      ).exec();

      let deleteArtist;
      let deleteArtistFromUser;
      if (artistPullRelease && !artistPullRelease.releases.length) {
        const artistId = artistPullRelease._id;
        deleteArtist = Artist.findByIdAndRemove(artistId).exec();
        deleteArtistFromUser = User.findByIdAndUpdate(req.user._id, { $pull: { artists: artistId } }).exec();
      }

      // Delete audio from S3
      const s3 = new aws.S3();

      // Delete source audio
      const listSrcParams = { Bucket: BUCKET_SRC, Prefix: `${releaseId}` };
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
      const listOptParams = { Bucket: BUCKET_OPT, Prefix: `mp4/${releaseId}` };
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

      // Delete art from S3
      const listImgParams = { Bucket: BUCKET_IMG, Prefix: `${releaseId}` };
      const s3ImgData = await s3.listObjectsV2(listImgParams).promise();

      let deleteS3Img;
      if (s3ImgData.Contents.length) {
        const deleteImgParams = {
          Bucket: BUCKET_IMG,
          Key: s3ImgData.Contents[0].Key
        };
        deleteS3Img = s3.deleteObject(deleteImgParams).promise();
      }

      const values = await Promise.all([
        deleteRelease,
        artistPullRelease,
        deleteArtist,
        deleteArtistFromUser,
        deleteS3Src,
        deleteS3Opt,
        deleteS3Img
      ]);

      res.send(values[0]._id);
    } catch (error) {
      res.status(500).send({ error });
    }
  });

  // Fetch Release
  app.get('/api/release/:releaseId', async (req, res) => {
    try {
      const release = await Release.findOne({ _id: req.params.releaseId });

      if (!release.published && !release.user.equals(req.user._id)) {
        throw new Error('This release is currently unavailable.');
      }

      const artist = await User.findOne({ _id: release.user }, 'nemAddress', { lean: true });
      const paymentInfo = { paymentAddress: nem.utils.format.address(artist.nemAddress) };
      res.send({ release: release.toJSON(), paymentInfo });
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
      const owner = await User.findById(release.user, 'nemAddress', { lean: true });
      const customerIdHash = req.user.auth.idHash;
      const xemPriceUsd = await fetchXemPrice().catch(() => fetchXemPriceBinance());
      const price = (release.price / xemPriceUsd).toFixed(6); // Convert depending on currency used.
      // eslint-disable-next-line
      req.session.price = price;

      if (!owner.nemAddress) {
        const error = 'NEM payment address not found!';
        const paymentInfo = { paymentAddress: null, paymentHash: null };
        res.send({ error, release, paymentInfo, price });
        return;
      }

      const hash = crypto.createHash('sha256');
      const paymentHash = hash.update(release._id.toString()).update(customerIdHash).digest('hex').substring(0, 31);
      const paymentInfo = { paymentAddress: nem.utils.format.address(owner.nemAddress), paymentHash };
      res.send({ release: release.toJSON(), paymentInfo, price });
    } catch (error) {
      res.status(500).send({ error: error.message });
    }
  });

  // Toggle Release Status
  app.patch('/api/release/:releaseId', requireLogin, releaseOwner, async (req, res) => {
    try {
      const release = res.locals.release;
      const { nemAddress } = req.user;

      if (!nemAddress || !nem.model.address.isValid(nemAddress)) {
        release.updateOne({ published: false }).exec();
        throw new Error(
          // eslint-disable-next-line
          "Please add a valid NEM address to your account before publishing this release ('Payment' tab)."
        );
      }

      if (release.artwork.status !== 'stored') {
        release.updateOne({ published: false }).exec();
        throw new Error('Please ensure the release has artwork uploaded before publishing.');
      }

      if (!release.trackList.length) {
        release.updateOne({ published: false }).exec();
        throw new Error('Please add at least one track to the release (with audio), before publishing.');
      }

      if (release.trackList.some(track => track.status !== 'stored')) {
        release.updateOne({ published: false }).exec();
        throw new Error('Please ensure that all tracks have audio uploaded before publishing.');
      }

      release.published = !release.published;
      const updatedRelease = await release.save();
      res.send(updatedRelease.toJSON());
    } catch (error) {
      res.status(200).send({ error: error.message });
    }
  });

  // Update Release
  app.put('/api/release', requireLogin, async (req, res) => {
    try {
      const releaseId = req.body._id;
      const userId = req.user._id;

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
      release.tags = tags;

      release.trackList.forEach(track => {
        track.trackTitle = trackList.find(update => update._id.toString() === track._id.toString()).trackTitle;
      });

      const updatedRelease = await release.save();

      // Add artist to Artist model.
      const artist = await Artist.findOneAndUpdate(
        { user: userId, name: updatedRelease.artistName },
        { $set: { name: updatedRelease.artistName } },
        { new: true, upsert: true }
      ).exec();

      // Add release ID to artist if it doesn't already exist.
      if (!artist.releases.some(id => id.equals(updatedRelease._id))) {
        await artist.updateOne({ $push: { releases: updatedRelease._id } }).exec();
        await updatedRelease.updateOne({ artist: artist._id }).exec();
      }

      // Add artist ID to user account if it doesn't already exist..
      await User.findOneAndUpdate(
        { _id: userId, artists: { $ne: artist._id } },
        { $push: { artists: artist._id } }
      ).exec();

      res.send(updatedRelease.toJSON());
    } catch (error) {
      res.status(500).send({ error: error.message });
    }
  });
};
