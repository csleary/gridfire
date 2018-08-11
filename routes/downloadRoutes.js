const archiver = require('archiver');
const aws = require('aws-sdk');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const request = require('request');
const keys = require('../config/keys');
const requireLogin = require('../middlewares/requireLogin');
const { AWS_REGION, BUCKET_IMG, BUCKET_SRC } = require('./constants');

const Release = mongoose.model('releases');
const User = mongoose.model('users');
aws.config.update({ region: AWS_REGION });
const { nemp3Secret } = keys;

module.exports = app => {
  // Fetch Download Token
  app.post('/api/download', requireLogin, async (req, res) => {
    const { releaseId } = req.body;
    const user = await User.findById(req.user._id);

    const hasPreviouslyPurchased = user.purchases.some(purchase =>
      purchase.releaseId.equals(releaseId)
    );

    if (hasPreviouslyPurchased) {
      const token = jwt.sign(
        {
          releaseId,
          expiresIn: '1m'
        },
        nemp3Secret
      );
      res.append('Authorization', `Bearer ${token}`);
      res.send();
    } else {
      res.status(401).send({ error: 'Not authorised.' });
    }
  });

  // Download Release
  app.get('/api/download/:token', async (req, res) => {
    const archive = archiver('zip');
    const s3 = new aws.S3();
    const token = req.params.token.substring(7);
    const decoded = jwt.verify(token, nemp3Secret);
    const { releaseId } = decoded;
    const prefix =
      process.env.NEM_NETWORK === 'mainnet' ? `${releaseId}` : 'test/test';
    const release = await Release.findById(releaseId);
    const { artistName, releaseTitle, trackList } = release;

    const s3List = await s3
      .listObjectsV2({ Bucket: BUCKET_SRC, Prefix: prefix })
      .promise();

    const downloadUrls = s3List.Contents.map(s3Track => {
      const title =
        process.env.NEM_NETWORK === 'mainnet'
          ? trackList.filter(track => s3Track.Key.includes(track._id))[0]
              .trackTitle
          : 'Test Track';

      const ext = s3Track.Key.substring(s3Track.Key.lastIndexOf('.'));

      const params = {
        Bucket: BUCKET_SRC,
        Expires: 60 * 60,
        Key: s3Track.Key
      };

      const url = s3.getSignedUrl('getObject', params);
      return { ext, title, url };
    });

    archive.on('end', () => {});

    archive.on('error', error => {
      res.status(500).send({ error: error.message });
    });

    res.attachment(`${artistName} - ${releaseTitle}.zip`);
    archive.pipe(res);

    downloadUrls.forEach((s3Track, index) => {
      const trackNumber =
        process.env.NEM_NETWORK === 'mainnet'
          ? trackList.findIndex(track => s3Track.url.includes(track._id)) + 1
          : index + 1;

      archive.append(request(s3Track.url, { encoding: null }), {
        name: `${trackNumber.toString(10).padStart(2, '0')} ${s3Track.title}${
          s3Track.ext
        }`
      });
    });

    const s3Art = await s3
      .listObjectsV2({ Bucket: BUCKET_IMG, Prefix: releaseId })
      .promise();

    const params = {
      Bucket: BUCKET_IMG,
      Expires: 60 * 60,
      Key: s3Art.Contents[0].Key
    };

    const artUrl = s3.getSignedUrl('getObject', params);

    archive.append(request(artUrl, { encoding: null }), {
      name: `${artistName} - ${releaseTitle}.jpg`
    });

    archive.finalize();
  });
};
