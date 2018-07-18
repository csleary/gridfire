const aws = require('aws-sdk');
const axios = require('axios');
const fs = require('fs');
const sharp = require('sharp');
const mongoose = require('mongoose');
const multer = require('multer');
const requireLogin = require('../middlewares/requireLogin');
const utils = require('./utils');
const { AWS_REGION } = require('./constants');
const { BUCKET_IMG } = require('./constants');

const { userOwnsRelease } = utils;
const Release = mongoose.model('releases');
const upload = multer({ dest: 'tmp/' });
aws.config.update({ region: AWS_REGION });

module.exports = app => {
  // Upload Artwork
  app.post(
    '/api/upload/artwork',
    upload.single('artwork'),
    requireLogin,
    async (req, res) => {
      try {
        const { releaseId } = req.body;

        // If replacing, delete from S3
        const s3 = new aws.S3();
        const listImgParams = {
          Bucket: BUCKET_IMG,
          Prefix: `${releaseId}`
        };
        const listS3Img = s3.listObjectsV2(listImgParams).promise();
        const s3ImgData = await listS3Img;

        let deleteS3Img;
        if (s3ImgData.Contents.length) {
          const deleteImgParams = {
            Bucket: BUCKET_IMG,
            Key: s3ImgData.Contents[0].Key
          };
          deleteS3Img = s3.deleteObject(deleteImgParams).promise();
          deleteS3Img;
        }

        // Upload new artwork
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
        const updateReleaseUrl = Release.findByIdAndUpdate(
          releaseId,
          {
            artwork: `https://s3.amazonaws.com/nemp3-img/${releaseId}${ext}`
          },
          { new: true }
        );

        const optimisedImg = await sharp(req.file.path)
          .resize(1000, 1000)
          .crop()
          .toFormat('jpeg')
          .toBuffer();

        axios
          .put(signedUrl, optimisedImg, axiosConfig)
          .then(() => updateReleaseUrl)
          .then(() => {
            fs.unlink(req.file.path, error => {
              if (error) {
                throw new Error(error);
              }
            });
            res.end();
          });
      } catch (error) {
        res.status(500).send({ error });
      }
    }
  );

  // Delete Artwork
  app.delete('/api/artwork/:releaseId', requireLogin, async (req, res) => {
    try {
      const { releaseId } = req.params;
      const release = await Release.findById(releaseId);

      if (!userOwnsRelease(req.user, release)) {
        res.status(401).send({ error: 'Not authorised.' });
        return;
      }

      // Delete from S3
      const s3 = new aws.S3();
      const listImgParams = {
        Bucket: BUCKET_IMG,
        Prefix: `${releaseId}`
      };
      const listS3Img = s3.listObjectsV2(listImgParams).promise();
      const s3ImgData = await listS3Img;

      let deleteS3Img;
      if (s3ImgData.Contents.length) {
        const deleteImgParams = {
          Bucket: BUCKET_IMG,
          Key: s3ImgData.Contents[0].Key
        };
        deleteS3Img = s3.deleteObject(deleteImgParams).promise();
        deleteS3Img
          .then(() => {
            release.artwork = undefined;
            release.save().then(doc => res.send(doc));
          })
          .catch(error => {
            throw new Error(error.message);
          });
      }
    } catch (error) {
      res.status(500).send({ error });
    }
  });
};
