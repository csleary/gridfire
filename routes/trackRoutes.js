const aws = require('aws-sdk');
const busboy = require('connect-busboy');
const fs = require('fs');
const mongoose = require('mongoose');
const path = require('path');
const { AWS_REGION, BUCKET_OPT, BUCKET_SRC, QUEUE_TRANSCODE, TEMP_PATH } = require('../config/constants');
const { publishToQueue } = require('../services/rabbitMQ/publisher');
const releaseOwner = require('../middlewares/releaseOwner');
const requireLogin = require('../middlewares/requireLogin');
aws.config.update({ region: AWS_REGION });
const Release = mongoose.model('releases');
const StreamSession = mongoose.model('stream-sessions');

module.exports = app => {
  // Add Track
  app.put('/api/:releaseId/add', requireLogin, releaseOwner, async (req, res) => {
    try {
      const { releaseId } = req.params;
      const release = await Release.findById(releaseId).exec();
      release.trackList.push({ status: 'pending', dateCreated: Date.now() });
      const updatedRelease = await release.save();
      res.send(updatedRelease.toJSON());
    } catch (error) {
      res.status(500).send({ error: error.message });
    }
  });

  // Fetch Init Range
  app.get('/api/:releaseId/:trackId/init', async (req, res) => {
    const { releaseId, trackId } = req.params;
    const user = req.user._id;
    const release = await Release.findById(releaseId, 'trackList user').exec();
    const { duration, initRange, segmentList } = release.trackList.id(trackId);
    const mp4Params = { Bucket: BUCKET_OPT, Expires: 15, Key: `mp4/${releaseId}/${trackId}.mp4` };
    const s3 = new aws.S3();
    const url = s3.getSignedUrl('getObject', mp4Params);
    res.send({ duration, url, range: initRange });

    if (!release.user.equals(user)) {
      StreamSession.create({ user, release: releaseId, trackId, segmentsTotal: segmentList.length });
    }
  });

  // Fetch Segment
  app.get('/api/:releaseId/:trackId/stream', async (req, res) => {
    const { releaseId, trackId } = req.params;
    const { time, type } = req.query;
    const user = req.user._id;
    const release = await Release.findById(releaseId, 'trackList user').exec();
    const { segmentList, segmentDuration, segmentTimescale } = release.trackList.id(trackId);
    const segmentTime = Number.parseFloat(time) / (segmentDuration / segmentTimescale);
    const indexLookup = { 0: 0, 1: Math.ceil(segmentTime), 2: Math.floor(segmentTime) };
    const index = indexLookup[type];
    const range = segmentList[index];
    const end = index + 1 === segmentList.length;
    const mp4Params = { Bucket: BUCKET_OPT, Expires: 15, Key: `mp4/${releaseId}/${trackId}.mp4` };
    const s3 = new aws.S3();
    const url = s3.getSignedUrl('getObject', mp4Params);
    res.send({ url, range, end });

    if (!release.user.equals(user)) {
      StreamSession.findOneAndUpdate(
        { user: req.user._id, trackId },
        { $inc: { segmentsFetched: 1 } },
        { new: true }
      ).exec();
    }
  });

  // Delete Track
  app.delete('/api/:releaseId/:trackId', requireLogin, releaseOwner, async (req, res) => {
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
        const deleteOptParams = { Bucket: BUCKET_OPT, Key: s3OptData.Contents[0].Key };
        deleteS3Opt = await s3.deleteObject(deleteOptParams).promise();
      }

      // Delete from db
      const deleteTrackDb = new Promise(resolve => {
        Release.findById(releaseId).exec((error, release) => {
          if (error) throw new Error(error);
          release.trackList.id(trackId).remove();
          if (!release.trackList.length) release.published = false;
          release.save().then(updatedRelease => resolve(updatedRelease));
        });
      });

      Promise.all([deleteTrackDb, deleteS3Src, deleteS3Opt])
        .then(promised => res.send(promised[0]))
        .catch(error => {
          throw new Error(error);
        });
    } catch (error) {
      res.status(500).send({ error: error.message });
    }
  });

  // Move track position
  app.patch('/api/:releaseId/:from/:to', requireLogin, releaseOwner, async (req, res) => {
    try {
      const { releaseId, from, to } = req.params;
      const release = await Release.findById(releaseId).exec();
      release.trackList.splice(to, 0, release.trackList.splice(from, 1)[0]);
      const updatedRelease = await release.save();
      res.send(updatedRelease.toJSON());
    } catch (error) {
      res.status(500).send({ error: error.message });
    }
  });

  // Get Upload Url
  app.get('/api/upload/audio', requireLogin, releaseOwner, async (req, res) => {
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
      res.status(500).send({ error: error.message });
    }
  });

  // Upload Audio
  app.post('/api/upload/audio', requireLogin, busboy({ limits: { fileSize: 1024 * 1024 * 200 } }), async (req, res) => {
    try {
      const io = app.get('socketio');
      const userId = req.user._id;
      let formData = {};

      req.busboy.on('field', (key, value) => {
        formData[key] = value;
      });

      req.busboy.on('file', async (fieldname, file, filename, encoding, mimetype) => {
        const { releaseId, trackId, trackName } = formData;

        if (releaseId) {
          const isUserRelease = await Release.exists({ _id: releaseId, user: userId });
          if (!isUserRelease) throw new Error('User is not authorised.');
        }

        const accepted = [
          'audio/aiff',
          'audio/x-aiff',
          'audio/flac',
          'audio/vnd.wav',
          'audio/wav',
          'audio/x-wav'
        ].includes(mimetype);

        if (!accepted) {
          throw new Error('File type not recognised. Needs to be flac/aiff/wav.');
        }

        const filePath = path.join(TEMP_PATH, trackId);
        const write = fs.createWriteStream(filePath, { autoClose: true });

        write.on('finish', async () => {
          const uploadedRelease = await Release.findOneAndUpdate(
            { _id: releaseId, 'trackList._id': trackId },
            { $set: { 'trackList.$.status': 'uploaded', 'trackList.$.dateUpdated': Date.now() } },
            { lean: true, new: true, select: '-__v' }
          ).exec();

          io.to(userId).emit('updateActiveRelease', { release: uploadedRelease });

          if ([userId, filePath, releaseId, trackId, trackName].includes(undefined)) {
            throw new Error('Job parameters missing.');
          }

          publishToQueue('', QUEUE_TRANSCODE, { userId, filePath, job: 'encodeFLAC', releaseId, trackId, trackName });
          res.end();
        });

        const uploadingRelease = await Release.findOneAndUpdate(
          { _id: releaseId, 'trackList._id': trackId },
          { $set: { 'trackList.$.status': 'uploading', 'trackList.$.dateUpdated': Date.now() } },
          { lean: true, new: true, select: '-__v' }
        ).exec();

        io.to(userId).emit('updateActiveRelease', { release: uploadingRelease });
        file.pipe(write);
      });

      req.busboy.on('finish', () => res.end());
      req.pipe(req.busboy);
    } catch (error) {
      res.status(500).send({ error: error.message });
    }
  });
};
