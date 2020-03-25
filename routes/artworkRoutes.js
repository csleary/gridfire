const { QUEUE_ARTWORK, TEMP_PATH } = require('../config/constants');
const { deleteArtwork } = require('../controllers/artworkController');
const fs = require('fs');
const multer = require('multer');
const path = require('path');
const { publishToQueue } = require('../services/rabbitMQ/publisher');
const releaseOwner = require('../middlewares/releaseOwner');
const requireLogin = require('../middlewares/requireLogin');
const upload = multer({ limits: { fileSize: '10MB' } });

module.exports = app => {
  app.post(
    '/api/upload/artwork',
    upload.single('artwork'),
    requireLogin,
    releaseOwner,
    async (req, res) => {
      try {
        const { file } = req;
        const { releaseId } = req.body;
        const filePath = path.join(TEMP_PATH, releaseId);
        const write = fs.createWriteStream(filePath);
        file.stream.pipe(write);

        write.on('finish', () => {
          publishToQueue('', QUEUE_ARTWORK, {
            filePath,
            releaseId,
            job: 'uploadArtwork',
            userId: req.user._id
          });

          res.end();
        });
      } catch (error) {
        res.status(500).send({ error: error.message });
      }
    }
  );

  app.delete(
    '/api/artwork/:releaseId',
    requireLogin,
    releaseOwner,
    async (req, res) => {
      try {
        const { releaseId } = req.params;
        const { release } = res.locals;
        const updated = await deleteArtwork(releaseId, release);
        res.send(updated);
      } catch (error) {
        res.status(500).send({ error: error.message });
      }
    }
  );
};
