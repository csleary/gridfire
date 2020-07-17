const { QUEUE_ARTWORK, TEMP_PATH } = require(__basedir + '/config/constants');
const { deleteArtwork } = require(__basedir + '/controllers/artworkController');
const fs = require('fs');
const multer = require('multer');
const path = require('path');
const { publishToQueue } = require(__basedir + '/services/rabbitMQ/publisher');
const releaseOwner = require(__basedir + '/middlewares/releaseOwner');
const requireLogin = require(__basedir + '/middlewares/requireLogin');
const upload = multer({ limits: { fileSize: '20MB' } });

module.exports = app => {
  app.post('/api/upload/artwork', upload.single('artwork'), requireLogin, releaseOwner, async (req, res) => {
    try {
      const { file } = req;
      const { releaseId } = req.body;
      const userId = req.user._id;
      const filePath = path.join(TEMP_PATH, releaseId);
      const write = fs.createWriteStream(filePath);
      file.stream.pipe(write);

      write.on('finish', () => {
        publishToQueue('', QUEUE_ARTWORK, {
          userId,
          filePath,
          releaseId,
          job: 'uploadArtwork'
        });
        res.end();
      });
    } catch (error) {
      res.status(500).send({ error: error.message });
    }
  });

  app.delete('/api/artwork/:releaseId', requireLogin, releaseOwner, async (req, res) => {
    try {
      const { releaseId } = req.params;
      const { release } = res.locals;
      const updated = await deleteArtwork(releaseId, release);
      res.send(updated);
    } catch (error) {
      res.status(500).send({ error: error.message });
    }
  });
};
