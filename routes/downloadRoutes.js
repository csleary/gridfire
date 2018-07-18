const archiver = require('archiver');
const aws = require('aws-sdk');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const request = require('request');
const keys = require('../config/keys');
const requireLogin = require('../middlewares/requireLogin');
const { AWS_REGION } = require('./constants');
const { BUCKET_SRC } = require('./constants');

const Release = mongoose.model('releases');
const User = mongoose.model('users');
aws.config.update({ region: AWS_REGION });

module.exports = app => {
  // Fetch Download token
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
          expiresIn: '10m'
        },
        keys.nemp3Secret
      );
      res.append('Authorization', `Bearer ${token}`);
      res.send({ success: 'Success.' });
    } else {
      res.status(401).send({ error: 'Not authorised.' });
    }
  });

  // Download Release
  app.get('/api/download/:token', async (req, res) => {
    const archive = archiver('zip');
    const s3 = new aws.S3();
    const token = req.params.token.substring(7);
    const decoded = jwt.verify(token, keys.nemp3Secret);
    const { releaseId } = decoded;
    const prefix =
      process.env.NEM_NETWORK === 'mainnet' ? `${releaseId}` : 'test/test';
    const release = await Release.findById(releaseId);
    const { trackList } = release;

    const s3TrackList = await s3
      .listObjectsV2({ Bucket: BUCKET_SRC, Prefix: prefix })
      .promise();

    const downloadUrlsList = async () => {
      const urls = [];
      const tracks = s3TrackList.Contents;

      tracks.forEach(async track => {
        const title =
          process.env.NEM_NETWORK === 'mainnet'
            ? trackList.filter(_track => track.Key.includes(_track._id))[0]
                .trackTitle
            : 'Test Track';

        const ext = track.Key.substring(track.Key.lastIndexOf('.'));

        const params = {
          Bucket: BUCKET_SRC,
          Expires: 60 * 5,
          Key: track.Key
        };

        const url = await s3.getSignedUrl('getObject', params);
        urls.push({ ext, title, url });
      });
      return urls;
    };
    const downloadUrls = await downloadUrlsList();

    archive.on('end', () => {});

    archive.on('error', error => {
      res.status(500).send({ error: error.message });
    });

    res.attachment(`${release.artistName} - ${release.releaseTitle}.zip`);
    archive.pipe(res);

    downloadUrls.forEach((track, index) => {
      const trackNumber =
        process.env.NEM_NETWORK === 'mainnet'
          ? release.trackList.findIndex(_track =>
              track.url.includes(_track._id)
            ) + 1
          : index + 1;

      archive.append(request(track.url, { encoding: null }), {
        name: `${trackNumber.toString(10).padStart(2, '0')} ${track.title}${
          track.ext
        }`
      });
    });
    archive.finalize();
  });
};
