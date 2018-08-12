const aws = require('aws-sdk');
const axios = require('axios');
const fs = require('fs');
const sharp = require('sharp');
const mongoose = require('mongoose');
const multer = require('multer');
const releaseOwner = require('../middlewares/releaseOwner');
const requireLogin = require('../middlewares/requireLogin');
const { AWS_REGION, BUCKET_IMG } = require('./constants');

const Release = mongoose.model('releases');
const upload = multer({ dest: 'tmp/' });
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
        const s3 = new aws.S3();
        const ext = '.jpg';
        const type = 'image/jpeg';
        const axiosConfig = { headers: { 'Content-Type': type } };
        const s3Params = {
          ContentType: `${type}`,
          Bucket: BUCKET_IMG,
          Expires: 30,
          Key: `${releaseId}${ext}`
        };
        const signedUrl = s3.getSignedUrl('putObject', s3Params);

        const updateReleaseArtwork = Release.findByIdAndUpdate(
          releaseId,
          { artwork: true },
          { new: true }
        ).select('-__v');

        const optimisedImg = await sharp(req.file.path)
          .resize(1000, 1000)
          .crop()
          .toFormat('jpeg')
          .toBuffer();

        axios
          .put(signedUrl, optimisedImg, axiosConfig)
          .then(() => updateReleaseArtwork)
          .then(updated => {
            fs.unlink(req.file.path, error => {
              if (error) {
                throw new Error(error);
              }
            });
            res.send(updated);
          });
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
        const s3 = new aws.S3();
        const listImgParams = {
          Bucket: BUCKET_IMG,
          Prefix: `${releaseId}`
        };
        const s3ImgData = await s3.listObjectsV2(listImgParams).promise();

        if (s3ImgData.Contents.length) {
          const deleteImgParams = {
            Bucket: BUCKET_IMG,
            Key: s3ImgData.Contents[0].Key
          };

          s3.deleteObject(deleteImgParams)
            .promise()
            .then(() => {
              release.artwork = undefined;
              release.save().then(doc => res.send(doc));
            })
            .catch(error => {
              throw new Error(error.message);
            });
        }
      } catch (error) {
        res.status(500).send({ error: error.message });
      }
    }
  );
};
