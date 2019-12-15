const aws = require('aws-sdk');
const sharp = require('sharp');
const mongoose = require('mongoose');
const multer = require('multer');
const releaseOwner = require('../middlewares/releaseOwner');
const requireLogin = require('../middlewares/requireLogin');
const { AWS_REGION, BUCKET_IMG } = require('../config/constants');

const Release = mongoose.model('releases');
const upload = multer();
aws.config.update({ region: AWS_REGION });

module.exports = app => {
  // Upload Artwork
  app.post(
    '/api/upload/artwork',
    upload.single('artwork'),
    requireLogin,
    releaseOwner,
    async (req, res) => {
      try {
        const { releaseId } = req.body;
        const { release } = res.locals;
        release.updateOne({ artwork: 'storing' }).exec();

        const optimisedImg = sharp()
          .resize(1000, 1000)
          .toFormat('jpeg');

        const s3Stream = req.file.stream.pipe(optimisedImg);

        const params = {
          ContentType: 'image/jpeg',
          Body: s3Stream,
          Bucket: BUCKET_IMG,
          Key: `${releaseId}.jpg`
        };

        const updateReleaseArtwork = Release.findByIdAndUpdate(
          releaseId,
          { artwork: 'stored' },
          { lean: true, new: true, select: '-__v' }
        );

        const s3 = new aws.S3();
        s3.upload(params)
          .promise()
          .then(() => updateReleaseArtwork)
          .then(updated => res.send(updated));
      } catch (error) {
        res.status(500).send({ error });
      }
    }
  );

  // Delete Artwork
  app.delete(
    '/api/artwork/:releaseId',
    requireLogin,
    releaseOwner,
    async (req, res) => {
      try {
        const { releaseId } = req.params;
        const { release } = res.locals;

        release.updateOne({ artwork: 'deleting' }).exec();

        const listImgParams = {
          Bucket: BUCKET_IMG,
          Prefix: `${releaseId}`
        };

        const s3 = new aws.S3();
        const s3ImgData = await s3.listObjectsV2(listImgParams).promise();

        if (s3ImgData.Contents.length) {
          const deleteImgParams = {
            Bucket: BUCKET_IMG,
            Key: s3ImgData.Contents[0].Key
          };

          const updateReleaseArtwork = Release.findByIdAndUpdate(
            releaseId,
            { $unset: { artwork: 1 }, published: false },
            { lean: true, new: true, select: '-__v' }
          );

          s3.deleteObject(deleteImgParams)
            .promise()
            .then(() => updateReleaseArtwork)
            .then(updated => res.send(updated))
            .catch(error => {
              throw new Error(error.message);
            });
        } else {
          release.updateOne({ published: false }).exec();
          throw new Error('Artwork file not found. Please upload a new file.');
        }
      } catch (error) {
        res.status(500).send({ error: error.message });
      }
    }
  );
};
