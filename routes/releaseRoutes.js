const { AWS_REGION, BUCKET_IMG, BUCKET_OPT, BUCKET_SRC } = require('../config/constants');
const { fetchXemPrice, fetchXemPriceBinance } = require('../controllers/nemController');
const aws = require('aws-sdk');
const { createArtist } = require('../controllers/artistController');
const crypto = require('crypto');
const express = require('express');
const mongoose = require('mongoose');
const nem = require('nem-sdk').default;
const releaseOwner = require('../middlewares/releaseOwner');
const requireLogin = require('../middlewares/requireLogin');
const router = express.Router();
const Artist = mongoose.model('artists');
const Release = mongoose.model('releases');
const User = mongoose.model('users');
aws.config.update({ region: AWS_REGION });

router.post('/', requireLogin, async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId, '', { lean: true }).exec();
    const releases = await Release.find({ user: userId }, '', { lean: true }).exec();

    if (!user.nemAddress || !user.nemAddressVerified) {
      return res.json({
        warning: 'Please add and verify your NEM address first. You will need credit to add a release.'
      });
    }

    if (user.credits <= releases.length) {
      return res.json({
        warning:
          'Sorry, you don\u2019t have enough credit to add a new release. Please add more nemp3 credits to cover the number of releases you wish to create.'
      });
    }

    const incompleteReleases = await Release.where({
      releaseTitle: { $exists: false },
      'artwork.status': 'pending',
      $where: 'this.trackList.length === 0'
    }).exec();

    if (incompleteReleases.length >= 3) {
      const io = req.app.get('socketio');
      const num = incompleteReleases.length;
      const [release] = incompleteReleases;
      res.json(release.toJSON());

      return io.to(userId).emit('notify', {
        type: 'warning',
        message: `It looks like you have ${num} release${
          num !== 1 ? 's' : ''
        } in need of completion already. Please complete ${num > 1 ? 'one of these' : 'that'} before creating another.`
      });
    }

    const release = await Release.create({
      user: userId,
      dateCreated: Date.now(),
      releaseDate: Date.now()
    });
    res.json(release.toJSON());
  } catch (error) {
    res.status(500).json({ error: error.message || error.toString() });
  }
});

router.delete('/:releaseId', requireLogin, releaseOwner, async (req, res) => {
  try {
    const { releaseId } = req.params;

    // Delete from db
    const { artist } = await Release.findById(releaseId, 'artist').exec();
    const deleteRelease = await Release.findByIdAndRemove(releaseId).exec();
    const artistHasReleases = await Release.exists({ artist });
    let deleteArtist;
    if (!artistHasReleases) deleteArtist = Artist.findByIdAndRemove(artist).exec();

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

    const [{ _id }] = await Promise.all([deleteRelease, deleteArtist, deleteS3Src, deleteS3Opt, deleteS3Img]);
    res.send(_id);
  } catch (error) {
    res.status(500).json({ error: error.message || error.toString() });
  }
});

router.get('/:releaseId', async (req, res) => {
  try {
    const release = await Release.findOne({ _id: req.params.releaseId });

    if (!release.published && !release.user.equals(req.user._id)) {
      throw new Error('This release is currently unavailable.');
    }

    const artist = await User.findOne({ _id: release.user }, 'nemAddress', { lean: true });
    const paymentInfo = { paymentAddress: nem.utils.format.address(artist.nemAddress) };
    res.json({ release: release.toJSON(), paymentInfo });
  } catch (error) {
    res.status(500).json({ error: error.message || error.toString() });
  }
});

router.get('/purchase/:releaseId', requireLogin, async (req, res) => {
  try {
    delete req.session.price;
    const { releaseId } = req.params;
    const release = await Release.findById(releaseId, '-__v', { lean: true });
    const owner = await User.findById(release.user, 'nemAddress', { lean: true });
    const customer = await User.findById(req.user._id, 'auth.idHash', { lean: true });
    const customerIdHash = customer.auth.idHash;

    const xemPriceUsd = await fetchXemPriceBinance().catch(() => fetchXemPrice());
    const priceInXem = release.price / xemPriceUsd;
    const priceInRawXem = Math.ceil(priceInXem * 10 ** 6);
    req.session.price = priceInRawXem;
    const price = (priceInRawXem / 10 ** 6).toFixed(6);

    if (!owner.nemAddress) {
      const error = 'NEM payment address not found.';
      const paymentInfo = { paymentAddress: null, paymentHash: null };
      return res.json({ error, release, paymentInfo, price });
    }

    const hash = crypto.createHash('sha256');
    const paymentHash = hash.update(release._id.toString()).update(customerIdHash).digest('hex').substring(0, 24);
    const paymentInfo = { paymentAddress: nem.utils.format.address(owner.nemAddress), paymentHash };
    res.json({ release, paymentInfo, price });
  } catch (error) {
    res.status(500).json({ error: error.message || error.toString() });
  }
});

router.patch('/:releaseId', requireLogin, releaseOwner, async (req, res) => {
  try {
    const { releaseId } = req.params;
    const { nemAddress } = req.user;
    const release = await Release.findById(releaseId).exec();

    if (!nemAddress || !nem.model.address.isValid(nemAddress)) {
      release.updateOne({ published: false }).exec();
      throw new Error(
        'Please add a confirmed NEM address to your account before publishing this release (\u2018Payment\u2019 tab).'
      );
    }

    if (release.artwork.status !== 'stored') {
      release.updateOne({ published: false }).exec();
      throw new Error('Please ensure the release has artwork uploaded before publishing.');
    }

    if (!release.trackList.length) {
      release.updateOne({ published: false }).exec();
      throw new Error('Please add at least one track to the release, with audio and a title, before publishing.');
    }

    if (release.trackList.some(track => track.status !== 'stored')) {
      release.updateOne({ published: false }).exec();
      throw new Error('Please ensure that all tracks have audio uploaded before publishing.');
    }

    if (release.trackList.some(track => !track.trackTitle)) {
      release.updateOne({ published: false }).exec();
      throw new Error('Please ensure that all tracks have titles set before publishing.');
    }

    release.published = !release.published;
    const updatedRelease = await release.save();
    res.json(updatedRelease.toJSON());
  } catch (error) {
    res.status(200).json({ error: error.message });
  }
});

router.put('/', requireLogin, async (req, res) => {
  try {
    const userId = req.user._id;

    const {
      artist: existingArtistId,
      artistName,
      catNumber,
      credits,
      info,
      price,
      pubYear,
      pubName,
      recYear,
      recName,
      recordLabel,
      releaseDate,
      releaseId,
      releaseTitle,
      tags,
      trackList
    } = req.body;

    let artist;
    if (existingArtistId && !artistName) {
      artist = await Artist.findById(existingArtistId, 'name', { lean: true }).exec();
    } else {
      [artist] = await createArtist(artistName, userId);
    }

    const artistId = artist._id;
    const release = await Release.findById(releaseId).exec();

    release.artist = artistId;
    release.artistName = artist.name;
    release.catNumber = catNumber;
    release.credits = credits;
    release.info = info;
    release.price = price;
    release.recordLabel = recordLabel;
    release.releaseDate = releaseDate;
    release.releaseTitle = releaseTitle;
    release.pubYear = pubYear;
    release.pubName = pubName;
    release.recYear = recYear;
    release.recName = recName;
    release.tags = tags;

    release.trackList.forEach(track => {
      track.trackTitle = trackList.find(update => track._id.equals(update._id)).trackTitle;
    });

    const updatedRelease = await release.save();
    res.json(updatedRelease.toJSON());
  } catch (error) {
    res.status(500).json({ error: error.message || error.toString() });
  }
});

module.exports = router;
