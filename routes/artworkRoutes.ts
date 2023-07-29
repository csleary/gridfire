import { deleteArtwork, uploadArtwork } from "gridfire/controllers/artworkController.js";
import Busboy from "busboy";
import assert from "assert/strict";
import express from "express";
import fs from "fs";
import mongoose from "mongoose";
import path from "path";
import requireLogin from "gridfire/middlewares/requireLogin.js";

const { TEMP_PATH } = process.env;
const Release = mongoose.model("Release");
const router = express.Router();

assert(TEMP_PATH, "TEMP_PATH env var missing.");

router.post("/:releaseId", requireLogin, async (req, res) => {
  try {
    const { releaseId } = req.params;
    const busboy = Busboy({ headers: req.headers, limits: { fileSize: 1024 * 1024 * 20 } });
    const { _id: userId } = req.user || {};
    if (!userId) return res.sendStatus(401);

    busboy.on("error", async error => {
      console.error(error);
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
          await uploadArtwork({ userId, filePath, releaseId });
          console.log(`[${releaseId}] Artwork uploaded.`);
          res.sendStatus(200);
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
    const { releaseId } = req.params;
    const { _id: userId } = req.user || {};
    if (!userId) return res.sendStatus(401);
    const releaseExists = await Release.findOne({ _id: releaseId, user: userId });
    if (!releaseExists) return res.end();
    console.log(`[${releaseId}] Deleting artwork…`);
    const updated = await deleteArtwork(releaseId);
    console.log(`[${releaseId}] Artwork deleted successfully.`);
    res.send(updated);
  } catch (error) {
    console.error(error);
    res.sendStatus(400);
  }
});

export default router;
