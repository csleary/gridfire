const aws = require('aws-sdk');
const mongoose = require('mongoose');
const { AWS_REGION, BUCKET_MP3 } = require('../config/constants');
const { zipDownload } = require('../controllers/archiveController');
const { encodeMp3 } = require('../controllers/encodingController');
const { generateToken, verifyToken } = require('../controllers/tokenController');
const requireLogin = require('../middlewares/requireLogin');
aws.config.update({ region: AWS_REGION });
const Release = mongoose.model('releases');
const Sale = mongoose.model('sales');

module.exports = app => {
  // Fetch Download Token
  app.post('/api/download', requireLogin, async (req, res) => {
    const { releaseId } = req.body;
    const hasPurchased = await Sale.exists({ user: req.user._id, release: releaseId });

    if (hasPurchased) {
      const token = generateToken({ releaseId });
      res.append('Authorization', `Bearer ${token}`);
      res.send();
    } else {
      res.status(401).send({ error: 'Not authorised.' });
    }
  });

  // Check if mp3s are cached or need building
  app.get('/api/download/:token/check', async (req, res) => {
    const s3 = new aws.S3();
    const [, token] = req.params.token.split(' ');
    const decoded = verifyToken(token);
    const { releaseId } = decoded;
    const release = await Release.findById(releaseId).exec();
    const { trackList } = release;
    const s3AudioMp3Query = await s3.listObjectsV2({ Bucket: BUCKET_MP3, Prefix: releaseId }).promise();
    const audioMp3Available = s3AudioMp3Query.KeyCount === trackList.length;
    if (!audioMp3Available) await encodeMp3(release);
    res.end();
  });

  // Download Release
  app.get('/api/download/:token/:format?', async (req, res) => {
    const format = req.params.format;
    const [, token] = req.params.token.split(' ');
    const decoded = verifyToken(token);
    const { releaseId } = decoded;
    const release = await Release.findById(releaseId).exec();

    switch (format) {
      case 'flac':
        zipDownload(res, release, 'flac');
        break;
      default:
        zipDownload(res, release);
    }
  });
};
