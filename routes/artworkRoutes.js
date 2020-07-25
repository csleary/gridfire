const { QUEUE_ARTWORK, TEMP_PATH } = require(__basedir + '/config/constants');
const { deleteArtwork } = require(__basedir + '/controllers/artworkController');
const busboy = require('connect-busboy');
const fs = require('fs');
const mongoose = require('mongoose');
const path = require('path');
const { publishToQueue } = require(__basedir + '/services/rabbitMQ/publisher');
const releaseOwner = require(__basedir + '/middlewares/releaseOwner');
const requireLogin = require(__basedir + '/middlewares/requireLogin');
const Release = mongoose.model('releases');

module.exports = app => {
  app.post(
    '/api/upload/artwork',
    requireLogin,
    busboy({ limits: { fileSize: 1024 * 1024 * 20 } }),
    async (req, res) => {
      try {
        let formData = {};
        const userId = req.user._id;

        req.busboy.on('field', (key, value) => {
          formData[key] = value;
        });

        req.busboy.on('file', async (fieldname, file) => {
          const { releaseId } = formData;

          if (releaseId) {
            const isUserRelease = await Release.exists({ _id: releaseId, user: userId });
            if (!isUserRelease) throw new Error('User is not authorised.');
          }

          const filePath = path.join(TEMP_PATH, releaseId);
          const write = fs.createWriteStream(filePath);
          file.pipe(write);

          if ([userId, filePath, releaseId].includes(undefined)) {
            throw new Error('Job parameters missing.');
          }

          write.on('finish', () => {
            publishToQueue('', QUEUE_ARTWORK, { userId, filePath, releaseId, job: 'uploadArtwork' });
            res.end();
          });
        });

        req.busboy.on('finish', () => res.end());
        req.pipe(req.busboy);
      } catch (error) {
        res.status(500).send({ error: error.message });
      }
    }
  );

  app.delete('/api/artwork/:releaseId', requireLogin, releaseOwner, async (req, res) => {
    try {
      const { releaseId } = req.params;
      const release = await Release.findById(releaseId, '-__v').exec();
      const updated = await deleteArtwork(releaseId, release);
      res.send(updated);
    } catch (error) {
      res.status(500).send({ error: error.message });
    }
  });
};
