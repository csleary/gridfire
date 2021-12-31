import { AWS_REGION, BUCKET_IMG, BUCKET_OPT, BUCKET_SRC } from '../config/constants.js';
import Artist from '../models/Artist.js';
import Release from '../models/Release.js';
import Sale from '../models/Sale.js';
import User from '../models/User.js';
import aws from 'aws-sdk';
import { createArtist } from '../controllers/artistController.js';
import crypto from 'crypto';
import { ethers } from 'ethers';
import express from 'express';
import releaseOwner from '../middlewares/releaseOwner.js';
import requireLogin from '../middlewares/requireLogin.js';

const { NETWORK } = process.env;
aws.config.update({ region: AWS_REGION });
const router = express.Router();

router.post('/', requireLogin, async (req, res) => {
  try {
    const userId = req.user._id;
    const release = await Release.create({ user: userId, releaseDate: Date.now() });
    res.json(release.toJSON());
  } catch (error) {
    res.status(400).json({ error: error.message || error.toString() });
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
    res.status(400).json({ error: error.message || error.toString() });
  }
});

router.get('/:releaseId', async (req, res) => {
  try {
    const release = await Release.findOne({ _id: req.params.releaseId });

    if (!release.published && !release.user.equals(req.user._id)) {
      throw new Error('This release is currently unavailable.');
    }

    res.json({ release: release.toJSON() });
  } catch (error) {
    res.status(400).json({ error: error.message || error.toString() });
  }
});

router.get('/purchase/:releaseId', requireLogin, async (req, res) => {
  try {
    const { releaseId } = req.params;
    const alreadyBought = await Sale.exists({ user: req.user._id, release: releaseId });
    if (alreadyBought) throw new Error('You already own this release.');
    const release = await Release.findById(releaseId, '-__v', { lean: true });
    const owner = await User.findById(release.user, 'auth.account', { lean: true });
    const paymentAddress = owner.auth.account;
    res.json({ release, paymentAddress });
  } catch (error) {
    res.status(400).json({ error: error.message || error.toString() });
  }
});

router.post('/purchase/:releaseId', requireLogin, async (req, res) => {
  try {
    const user = req.user._id;
    const { releaseId } = req.params;
    const { transactionHash } = req.body;
    const release = await Release.findById(releaseId, 'price', { lean: true });
    const provider = ethers.getDefaultProvider(NETWORK);
    const transaction = await provider.waitForTransaction(transactionHash);
    const { from: buyer, confirmations } = transaction;

    if (confirmations > 0) {
      await Sale.create({
        purchaseDate: Date.now(),
        release: releaseId,
        paid: release.price,
        transaction,
        user,
        userAddress: buyer
      }).catch(error => {
        if (error.code === 11000) {
          console.log('already own this');
        }
      });
    }

    res.sendStatus(200);
  } catch (error) {
    console.log(error);
    res.status(400).json({ error: error.message || error.toString() });
  }
});

router.patch('/:releaseId', requireLogin, releaseOwner, async (req, res) => {
  try {
    const { releaseId } = req.params;
    const release = await Release.findById(releaseId).exec();

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
    if (existingArtistId) {
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
    res.status(400).json({ error: error.message || error.toString() });
  }
});

export default router;
