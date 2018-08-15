const aws = require('aws-sdk');
const ffmpeg = require('fluent-ffmpeg');
const fsPromises = require('fs').promises;
const mongoose = require('mongoose');
const multer = require('multer');
const { AWS_REGION, BUCKET_OPT, BUCKET_SRC } = require('./constants');
const releaseOwner = require('../middlewares/releaseOwner');
const requireLogin = require('../middlewares/requireLogin');

aws.config.update({ region: AWS_REGION });
const Release = mongoose.model('releases');
const upload = multer();

module.exports = app => {
  // Add Track
  app.put(
    '/api/:releaseId/add',
    requireLogin,
    releaseOwner,
    async (req, res) => {
      const release = res.locals.release;
      release.trackList.push({});
      release
        .save()
        .then(updated => res.send(updated.toObject({ versionKey: false })))
        .catch(error => res.status(500).send({ error }));
    }
  );

  // Play Track
  app.get('/api/play-track', async (req, res) => {
    try {
      const { releaseId, trackId } = req.query;
      const s3 = new aws.S3();

      const list = await s3
        .listObjectsV2({
          Bucket: BUCKET_OPT,
          Prefix: `m4a/${releaseId}/${trackId}`
        })
        .promise();

      const params = {
        Bucket: BUCKET_OPT,
        Expires: 30,
        Key: list.Contents[0].Key
      };

      const playUrl = s3.getSignedUrl('getObject', params);
      res.send(playUrl);
    } catch (error) {
      res.status(500).send({ error: error.message });
    }
  });

  // Delete Track
  app.delete(
    '/api/:releaseId/:trackId',
    requireLogin,
    releaseOwner,
    async (req, res) => {
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
        const deleteImgParams = {
          Bucket: BUCKET_SRC,
          Key: s3SrcData.Contents[0].Key
        };
        deleteS3Src = await s3.deleteObject(deleteImgParams).promise();
      }

      // Delete streaming audio
      const listOptParams = {
        Bucket: BUCKET_OPT,
        Prefix: `m4a/${releaseId}/${trackId}`
      };
      const s3OptData = await s3.listObjectsV2(listOptParams).promise();

      let deleteS3Opt;
      if (s3OptData.Contents.length) {
        const deleteImgParams = {
          Bucket: BUCKET_OPT,
          Key: s3OptData.Contents[0].Key
        };
        deleteS3Opt = await s3.deleteObject(deleteImgParams).promise();
      }

      // Delete from db
      const deleteTrackDb = await Release.findByIdAndUpdate(
        releaseId,
        { $pull: { trackList: { _id: trackId } } },
        { new: true }
      );

      Promise.all([deleteS3Src, deleteS3Opt, deleteTrackDb])
        .then(promised => res.send(promised[2]))
        .catch(error => res.status(500).send({ error: error.message }));
    }
  );

  // Move track position
  app.patch(
    '/api/:releaseId/:from/:to',
    requireLogin,
    releaseOwner,
    async (req, res) => {
      try {
        const { from, to } = req.params;
        const release = res.locals.release;
        release.trackList.splice(to, 0, release.trackList.splice(from, 1)[0]);
        release
          .save()
          .then(updatedRelease =>
            res.send(updatedRelease.toObject({ versionKey: false }))
          );
      } catch (error) {
        res.status(500).send({ error: error.message });
      }
    }
  );

  // Transcode Audio
  app.get(
    '/api/transcode/audio',
    requireLogin,
    releaseOwner,
    async (req, res) => {
      try {
        const { releaseId, trackId, trackName } = req.query;
        const s3 = new aws.S3();

        const listParams = {
          Bucket: BUCKET_SRC,
          Prefix: `${releaseId}/${trackId}`
        };

        const inputAudio = await s3.listObjectsV2(listParams).promise();
        const { Key } = inputAudio.Contents[0];
        const tempPath = `tmp/${trackId}`;

        const downloadSrc = s3
          .getObject({ Bucket: BUCKET_SRC, Key })
          .createReadStream();

        ffmpeg(downloadSrc)
          .audioCodec('libfdk_aac')
          .audioBitrate(128)
          .audioChannels(2)
          .toFormat('mp4')
          .outputOptions('-movflags +faststart')
          .on('error', error => {
            throw new Error(`Transcoding error: ${error.message}`);
          })
          .on('end', async () => {
            const optData = await fsPromises.readFile(tempPath);

            const uploadParams = {
              Bucket: BUCKET_OPT,
              ContentType: 'audio/mp4',
              Key: `m4a/${releaseId}/${trackId}.m4a`,
              Body: optData
            };

            s3.upload(uploadParams)
              .promise()
              .then(() => fsPromises.unlink(tempPath))
              .then(() => {
                const release = res.locals.release;
                const trackDoc = release.trackList.id(trackId);
                trackDoc.hasAudio = true;
                release.save().then(updatedRelease =>
                  res.send({
                    updatedRelease,
                    success: `Transcoding ${trackName} to aac complete.`
                  })
                );
              });
          })
          .save(tempPath);
      } catch (error) {
        res.status(500).send({ error: error.message });
      }
    }
  );

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
      const params = {
        ContentType: `${type}`,
        Bucket: BUCKET_SRC,
        Expires: 30,
        Key: key
      };

      const audioUploadUrl = s3.getSignedUrl('putObject', params);
      res.send(audioUploadUrl);
    } catch (error) {
      res.status(500).send({ error: error.message });
    }
  });

  // Upload Audio
  app.post(
    '/api/upload/audio',
    upload.single('audio'),
    requireLogin,
    releaseOwner,
    async (req, res) => {
      try {
        const { releaseId, trackId, type } = req.body;
        const s3 = new aws.S3();
        const tempPath = `tmp/${trackId}`;

        if (
          ![
            'audio/aiff',
            'audio/x-aiff',
            'audio/flac',
            'audio/vnd.wav',
            'audio/wav',
            'audio/x-wav'
          ].includes(type)
        ) {
          throw new Error(
            'File type not recognised. Needs to be flac/aiff/wav.'
          );
        }

        ffmpeg(req.file.stream)
          .audioCodec('flac')
          .audioChannels(2)
          .toFormat('flac')
          .outputOptions('-compression_level 12')
          .on('end', async () => {
            const s3Stream = await fsPromises.readFile(tempPath);
            const Key = `${releaseId}/${trackId}.flac`;
            const params = { Bucket: BUCKET_SRC, Key, Body: s3Stream };

            s3.upload(params)
              .promise()
              .then(() => fsPromises.unlink(tempPath))
              .then(() => res.end());
          })
          .save(tempPath);
      } catch (error) {
        res.status(500).send({ error: error.message });
      }
    }
  );
};
