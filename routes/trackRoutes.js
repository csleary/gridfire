const aws = require('aws-sdk');
const mongoose = require('mongoose');
const releaseOwner = require('../middlewares/releaseOwner');
const requireLogin = require('../middlewares/requireLogin');
const { AWS_REGION } = require('./constants');
const { BUCKET_SRC } = require('./constants');
const { BUCKET_OPT } = require('./constants');
const { TRANSCODER_PIPELINE_ID } = require('./constants');

const Release = mongoose.model('releases');
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
        .then(updated => res.send(updated))
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
        Expires: 60 * 5,
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
      const listS3Src = s3.listObjectsV2(listSrcParams).promise();
      const s3SrcData = await listS3Src;

      let deleteS3Src;
      if (s3SrcData.Contents.length) {
        const deleteImgParams = {
          Bucket: BUCKET_SRC,
          Key: s3SrcData.Contents[0].Key
        };

        deleteS3Src = s3.deleteObject(deleteImgParams).promise();
        deleteS3Src;
      }

      // Delete streaming audio
      const listOptParams = {
        Bucket: BUCKET_OPT,
        Prefix: `m4a/${releaseId}/${trackId}`
      };
      const listS3Opt = s3.listObjectsV2(listOptParams).promise();
      const s3OptData = await listS3Opt;

      let deleteS3Opt;
      if (s3OptData.Contents.length) {
        const deleteImgParams = {
          Bucket: BUCKET_OPT,
          Key: s3OptData.Contents[0].Key
        };

        deleteS3Opt = s3.deleteObject(deleteImgParams).promise();
        deleteS3Opt;
      }

      // Delete from db
      const updatedRelease = await release
        .update({ $pull: { trackList: { _id: trackId } } })
        .exec();

      Promise.all([
        updatedRelease,
        listS3Src,
        deleteS3Src,
        listS3Opt,
        deleteS3Opt
      ])
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
      const { from, to } = req.params;
      const release = res.locals.release;
      release.trackList.splice(to, 0, release.trackList.splice(from, 1)[0]);
      release.save().then(updatedRelease => res.send(updatedRelease));
    }
  );

  // Transcode Audio
  app.get('/api/transcode/audio', requireLogin, async (req, res) => {
    const { releaseId, trackId } = req.query;
    const s3 = new aws.S3();
    const listParams = {
      Bucket: BUCKET_SRC,
      Prefix: `${releaseId}/${trackId}`
    };

    const inputAudio = await s3.listObjectsV2(listParams).promise();
    const transcoder = new aws.ElasticTranscoder();
    const transcoderParams = {
      PipelineId: TRANSCODER_PIPELINE_ID,
      Inputs: [
        {
          Key: inputAudio.Contents[0].Key,
          Container: 'auto'
        }
      ],
      Outputs: [
        {
          Key: `${releaseId}/${trackId}.m4a`,
          PresetId: '1351620000001-100130'
        }
      ],
      OutputKeyPrefix: 'm4a/'
    };

    transcoder.createJob(transcoderParams, (error, data) => {
      if (error) {
        res.status(500).send({ error: error.message });
      } else res.send(data);
    });
  });

  // Upload Audio
  app.get('/api/upload/audio', requireLogin, async (req, res) => {
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

      const release = await Release.findById(releaseId);
      const audioUploadUrl = s3.getSignedUrl('putObject', params);
      const index = release.trackList.findIndex(
        track => track._id.toString() === trackId
      );
      release.trackList[index].hasAudio = true;
      release.save().then(() => res.send(audioUploadUrl));
    } catch (error) {
      res.status(500).send({ error: error.message });
    }
  });
};
