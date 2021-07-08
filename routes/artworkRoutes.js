import { deleteArtwork, uploadArtwork } from '../controllers/artworkController.js';
import Release from '../models/Release.js';
import { TEMP_PATH } from '../config/constants.js';
import busboy from 'connect-busboy';
import express from 'express';
import fs from 'fs';
import path from 'path';
import releaseOwner from '../middlewares/releaseOwner.js';
import requireLogin from '../middlewares/requireLogin.js';
const router = express.Router();

router.post('/', requireLogin, busboy({ limits: { fileSize: 1024 * 1024 * 20 } }), async (req, res) => {
  try {
    const io = req.app.get('socketio');
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

      write.on('finish', () => uploadArtwork({ userId, filePath, releaseId }, io));
    });

    req.busboy.on('finish', () => res.end());
    req.pipe(req.busboy);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

router.delete('/:releaseId', requireLogin, releaseOwner, async (req, res) => {
  try {
    const { releaseId } = req.params;
    const release = await Release.findById(releaseId, '-__v').exec();
    const updated = await deleteArtwork(releaseId, release);
    res.send(updated);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

export default router;
