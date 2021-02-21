const aws = require('aws-sdk');
const mongoose = require('mongoose');
const { AWS_REGION, BUCKET_MP3, QUEUE_TRANSCODE } = require('../config/constants');
const { zipDownload } = require(__basedir + '/controllers/archiveController');
const { generateToken, verifyToken } = require(__basedir + '/controllers/tokenController');
const { publishToQueue } = require(__basedir + '/services/rabbitMQ/publisher');
const requireLogin = require(__basedir + '/middlewares/requireLogin');
aws.config.update({ region: AWS_REGION });
const Release = mongoose.model('releases');
const Sale = mongoose.model('sales');

module.exports = app => {
  // Fetch Download Token
  app.post('/api/download', requireLogin, async (req, res) => {
    try {
      const { releaseId } = req.body;
      const userId = req.user._id;
      const hasPurchased = await Sale.exists({ user: userId, release: releaseId });

      if (hasPurchased) {
        const token = generateToken({ releaseId, userId });
        res.append('Authorization', `Bearer ${token}`);
        res.sendStatus(200);
      } else {
        res.status(401).send({ error: 'Not authorised.' });
      }
    } catch (error) {
      res.status(500).send({ error: error.message || error.toString() });
    }
  });

  // Check if mp3s are cached or need building
  app.get('/api/download/check', requireLogin, async (req, res) => {
    try {
      const [, token] = req.headers.authorization.split(' ');
      if (!token) return res.sendStatus(401);
      const decoded = verifyToken(token);
      const { releaseId, userId } = decoded;
      if (!req.user._id.equals(userId)) return res.sendStatus(403);
      const release = await Release.findById(releaseId, 'trackList', { lean: true }).exec();
      if (!release) throw new Error('Release not available.');
      const s3 = new aws.S3();
      const s3AudioMp3Query = await s3.listObjectsV2({ Bucket: BUCKET_MP3, Prefix: releaseId }).promise();
      const { trackList } = release;
      const audioMp3Available = s3AudioMp3Query.KeyCount === trackList.length;
      if (audioMp3Available) return res.json({ exists: true });
      publishToQueue('', QUEUE_TRANSCODE, { job: 'transcodeMP3', releaseId, userId });
      res.json({ exists: false });
    } catch (error) {
      res.status(500).send({ error: error.message || error.toString() });
    }
  });

  // Download Release
  app.get('/api/download/:token/:format?', requireLogin, async (req, res) => {
    const { format, token } = req.params;
    if (!token) return res.sendStatus(401);
    const decoded = verifyToken(token);
    const { releaseId, userId } = decoded;
    if (!req.user._id.equals(userId)) return res.sendStatus(403);
    const release = await Release.findById(releaseId, 'artistName releaseTitle trackList', { lean: true }).exec();

    switch (format) {
      case 'flac':
        zipDownload(res, release, 'flac');
        break;
      default:
        zipDownload(res, release);
    }
  });
};
