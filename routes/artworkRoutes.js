const multer = require('multer');
const {
  deleteArtwork,
  uploadArtwork
} = require('../controllers/artworkController');
const releaseOwner = require('../middlewares/releaseOwner');
const requireLogin = require('../middlewares/requireLogin');
const upload = multer();

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
        const { release } = res.locals;
        const updated = await uploadArtwork(file, releaseId, release);
        res.send(updated);
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
