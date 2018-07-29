const aws = require('aws-sdk');
const ffmpeg = require('fluent-ffmpeg');
const fsPromises = require('fs').promises;
const releaseOwner = require('../middlewares/releaseOwner');
const requireLogin = require('../middlewares/requireLogin');
const { AWS_REGION } = require('./constants');
const { BUCKET_SRC } = require('./constants');
const { BUCKET_OPT } = require('./constants');

aws.config.update({ region: AWS_REGION });

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
      const release = res.locals.release;

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
      const deleteTrackDb = await release
        .update({ $pull: { trackList: { _id: trackId } } })
        .exec();

      Promise.all([deleteS3Src, deleteS3Opt, deleteTrackDb])
        .then(() => {
          res.send(release);
        })
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

            s3.putObject(uploadParams)
              .promise()
              .then(() => fsPromises.unlink(tempPath))
              .then(() => {
                const release = res.locals.release;
                const trackDoc = release.trackList.id(trackId);
                trackDoc.hasAudio = true;
                release.save().then(
                  res.send({
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

  // Upload Audio
  app.get('/api/upload/audio', requireLogin, releaseOwner, async (req, res) => {
    try {
      const { releaseId, trackId, type } = req.query;

      let ext;
      if (type === 'audio/wav') {
        ext = '.wav';
      } else if (type === 'audio/aiff') {
        ext = '.aiff';
      }

      const s3 = new aws.S3();
      const key = `${releaseId}/${trackId}${ext}`;
      const params = {
        ContentType: `${type}`,
        Bucket: BUCKET_SRC,
        Expires: 30,
        Key: key
      };

      // const release = await Release.findById(releaseId);
      const audioUploadUrl = s3.getSignedUrl('putObject', params);
      res.send(audioUploadUrl);
    } catch (error) {
      res.status(500).send({ error: error.message });
    }
  });
};
