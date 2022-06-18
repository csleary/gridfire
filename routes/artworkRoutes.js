import { deleteArtwork, uploadArtwork } from "gridfire/controllers/artworkController.js";
import Busboy from "busboy";
import Release from "gridfire/models/Release.js";
import express from "express";
import fs from "fs";
import path from "path";
import requireLogin from "gridfire/middlewares/requireLogin.js";

const { TEMP_PATH } = process.env;
const router = express.Router();

router.post("/:releaseId", requireLogin, async (req, res) => {
  try {
    const { ipfs } = req.app.locals;
    const { releaseId } = req.params;
    const busboy = Busboy({ headers: req.headers, limits: { fileSize: 1024 * 1024 * 20 } });
    const { sse } = req.app.locals;
    const userId = req.user._id;

    busboy.on("error", async error => {
      console.log(error);
      req.unpipe(busboy);
      if (res.headersSent) return;
      res.status(400).json({ error: "Error. We were unable to store this file." });
    });

    busboy.on("file", async (fieldName, file, info) => {
      if (fieldName !== "artworkImageFile") return res.sendStatus(403);
      const { filename, encoding, mimeType } = info;

      console.log(
        `[Release ${releaseId}] Uploading artwork: ${filename}, encoding: ${encoding}, mime type: ${mimeType}`
      );

      const releaseExists = await Release.exists({ _id: releaseId, user: userId });
      if (!releaseExists) await Release.create({ _id: releaseId, user: userId });
      const filePath = path.join(TEMP_PATH, releaseId);
      const write = fs.createWriteStream(filePath);
      file.pipe(write);

      write.on("finish", async () => {
        try {
          const cid = await uploadArtwork({ userId, filePath, ipfs, releaseId, sse });
          console.log(`[${releaseId}] Artwork uploaded with CID: ${cid}.`);
        } catch (error) {
          busboy.emit("error", error);
        }
      });
    });

    req.pipe(busboy);
  } catch (error) {
    console.log(error);
    if (res.headersSent) return;
    res.status(400).send({ error: "Error. Could not upload this file" });
  }
});

router.delete("/:releaseId", requireLogin, async (req, res) => {
  try {
    const { ipfs } = req.app.locals;
    const { releaseId } = req.params;
    const userId = req.user._id;
    const releaseExists = await Release.findOne({ _id: releaseId, user: userId });
    if (!releaseExists) return res.end();
    console.log(`[${releaseId}] Deleting artwork…`);
    const updated = await deleteArtwork({ ipfs, releaseId });
    console.log(`[${releaseId}] Artwork deleted successfully.`);
    res.send(updated);
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
});

export default router;
