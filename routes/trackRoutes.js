import { AWS_REGION, BUCKET_OPT, BUCKET_SRC, QUEUE_TRANSCODE, TEMP_PATH } from '../config/constants.js';
import Busboy from 'busboy';
import Release from '../models/Release.js';
import StreamSession from '../models/StreamSession.js';
import aws from 'aws-sdk';
import express from 'express';
import fs from 'fs';
import mongoose from 'mongoose';
import path from 'path';
import { publishToQueue } from '../controllers/amqp/publisher.js';
import releaseOwner from '../middlewares/releaseOwner.js';
import requireLogin from '../middlewares/requireLogin.js';

aws.config.update({ region: AWS_REGION });
const router = express.Router();

router.put('/:releaseId/add', requireLogin, releaseOwner, async (req, res) => {
  try {
    const { releaseId } = req.params;
    const { newTrack } = req.body;
    const release = await Release.findById(releaseId).exec();
    release.trackList.push(newTrack);
    const updatedRelease = await release.save();
    res.send(updatedRelease.toJSON());
  } catch (error) {
    res.status(400).json({ error: error.message || error.toString() });
  }
});

router.get('/:trackId/init', async (req, res) => {
  const { trackId } = req.params;
  const release = await Release.findOne({ 'trackList._id': trackId }, 'trackList.$ user').exec();
  const releaseId = release._id;
  const { duration, initRange, segmentList } = release.trackList.id(trackId);
  const mp4Params = { Bucket: BUCKET_OPT, Expires: 10, Key: `mp4/${releaseId}/${trackId}.mp4` };
  const s3 = new aws.S3();
  const url = s3.getSignedUrl('getObject', mp4Params);

  // If user is not logged in, generate a session userId for play tracking (or use one already present in session from previous anonymous plays).
  let user = req.user && req.user._id;
  if (!user) {
    user = req.session.user || mongoose.Types.ObjectId();
    req.session.user = user;
  }

  res.send({ duration, url, range: initRange });

  if (!release.user.equals(user)) {
    try {
      await StreamSession.create({
        user,
        release: releaseId,
        trackId,
        segmentsTotal: segmentList.length
      });
    } catch (error) {
      if (error.code === 11000) return;
      res.status(400).json({ error: error.message || error.toString() });
    }
  }
});

router.get('/:trackId/stream', async (req, res) => {
  try {
    const { trackId } = req.params;
    const { time, type } = req.query;
    const release = await Release.findOne({ 'trackList._id': trackId }, 'trackList.$ user').exec();
    const releaseId = release._id;
    const { segmentList, segmentDuration, segmentTimescale } = release.trackList.id(trackId);
    const segmentTime = Number.parseFloat(time) / (segmentDuration / segmentTimescale);
    const indexLookup = { 0: 0, 1: Math.ceil(segmentTime), 2: Math.floor(segmentTime) };
    const index = indexLookup[type];
    const range = segmentList[index];
    const end = index + 1 === segmentList.length;
    const mp4Params = { Bucket: BUCKET_OPT, Expires: 10, Key: `mp4/${releaseId}/${trackId}.mp4` };
    const s3 = new aws.S3();
    const url = s3.getSignedUrl('getObject', mp4Params);
    res.send({ url, range, end });

    // If user is not logged in, use the session userId for play tracking.
    let user = req.user && req.user._id;
    if (!user) {
      user = req.session.user;
    }

    if (!release.user.equals(user)) {
      await StreamSession.findOneAndUpdate({ user, trackId }, { $inc: { segmentsFetched: 1 } }, { new: true }).exec();
    }
  } catch (error) {
    res.status(400).json({ error: error.message || error.toString() });
  }
});

router.delete('/:releaseId/:trackId', requireLogin, releaseOwner, async (req, res) => {
  try {
    const { releaseId, trackId } = req.params;

    // Delete from S3
    const s3 = new aws.S3();

    // Delete source audio
    const listSrcParams = {
      Bucket: BUCKET_SRC,
      Prefix: `${releaseId}/${trackId}`
    };

    const s3SrcData = await s3.listObjectsV2(listSrcParams).promise();

    let deleteS3Src;
    if (s3SrcData.Contents.length) {
      const deleteImgParams = { Bucket: BUCKET_SRC, Key: s3SrcData.Contents[0].Key };
      deleteS3Src = await s3.deleteObject(deleteImgParams).promise();
    }

    // Delete streaming audio
    const listOptParams = { Bucket: BUCKET_OPT, Prefix: `mp4/${releaseId}/${trackId}` };
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

      deleteS3Opt = await s3.deleteObjects(deleteOptParams).promise();
    }

    // Delete from db
    const deleteTrackDb = new Promise((resolve, reject) => {
      Release.findById(releaseId).exec((error, release) => {
        try {
          if (error) reject(error);
          release.trackList.id(trackId).remove();
          if (!release.trackList.length) release.published = false;
          release.save().then(updatedRelease => resolve(updatedRelease.toJSON()));
        } catch (error) {
          reject(error);
        }
      });
    });

    Promise.all([deleteTrackDb, deleteS3Src, deleteS3Opt])
      .then(promised => res.send(promised[0]))
      .catch(error => {
        throw new Error(error);
      });
  } catch (error) {
    res.status(400).json({ error: error.message || error.toString() });
  }
});

router.patch('/:releaseId/:from/:to', requireLogin, releaseOwner, async (req, res) => {
  try {
    const { releaseId, from, to } = req.params;
    const release = await Release.findById(releaseId).exec();
    release.trackList.splice(to, 0, release.trackList.splice(from, 1)[0]);
    const updatedRelease = await release.save();
    res.send(updatedRelease.toJSON());
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
});

router.get('/upload', requireLogin, releaseOwner, async (req, res) => {
  try {
    const { releaseId, trackId, type } = req.query;

    let ext;
    switch (type) {
      case 'audio/aiff':
        ext = '.aiff';
        break;
      case 'audio/flac':
        ext = '.flac';
        break;
      case 'audio/wav':
        ext = '.wav';
        break;
      default:
    }

    const s3 = new aws.S3();
    const key = `${releaseId}/${trackId}${ext}`;
    const params = { ContentType: `${type}`, Bucket: BUCKET_SRC, Expires: 30, Key: key };
    const audioUploadUrl = s3.getSignedUrl('putObject', params);
    res.send(audioUploadUrl);
  } catch (error) {
    res.status(400).json({ error: error.message || error.toString() });
  }
});

router.post('/upload', requireLogin, async (req, res) => {
  try {
    const { app, headers, user } = req;
    const userId = user._id.toString();
    const io = app.get('socketio');
    const operatorUser = io.to(userId);
    const busboy = Busboy({ headers, limits: { fileSize: 1024 * 1024 * 200 } });
    const formData = {};

    busboy.on('field', (key, value) => {
      formData[key] = value;
    });

    busboy.on('file', async (filename, file, { mimeType }) => {
      const { releaseId, trackId, trackName } = formData;

      if (releaseId) {
        const isUserRelease = await Release.exists({ _id: releaseId, user: userId });
        if (!isUserRelease) throw new Error('User is not authorised.');
      }

      const accepted = [
        'audio/aiff',
        'audio/x-aiff',
        'audio/flac',
        'audio/x-flac',
        'audio/wav',
        'audio/wave',
        'audio/vnd.wave',
        'audio/x-wave'
      ].includes(mimeType);

      if (!accepted) {
        throw new Error('File type not recognised. Needs to be flac/aiff/wav.');
      }

      const filePath = path.resolve(TEMP_PATH, trackId);
      const write = fs.createWriteStream(filePath, { autoClose: true });

      write.on('finish', () => {
        Release.findOneAndUpdate(
          { _id: releaseId, 'trackList._id': trackId },
          { $set: { 'trackList.$.status': 'uploaded', 'trackList.$.dateUpdated': Date.now() } },
          { new: true }
        )
          .exec()
          .then(() => operatorUser.emit('updateTrackStatus', { releaseId, trackId, status: 'uploaded' }));

        if ([userId, filePath, releaseId, trackId, trackName].includes(undefined)) {
          throw new Error('Job parameters missing.');
        }

        publishToQueue('', QUEUE_TRANSCODE, { userId, filePath, job: 'encodeFLAC', releaseId, trackId, trackName });
      });

      Release.findOneAndUpdate(
        { _id: releaseId, 'trackList._id': trackId },
        { $set: { 'trackList.$.status': 'uploading', 'trackList.$.dateUpdated': Date.now() } },
        { new: true }
      )
        .exec()
        .then(() => {
          operatorUser.emit('updateTrackStatus', { releaseId, trackId, status: 'uploading' });
        });

      file.pipe(write);
    });

    busboy.on('finish', () => res.sendStatus(200));
    req.pipe(busboy);
  } catch (error) {
    console.log(error.toString());
    res.status(400).json({ error: 'Encountered an error attempting to upload this file.' });
  }
});

export default router;
