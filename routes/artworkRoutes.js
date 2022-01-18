import { deleteArtwork, uploadArtwork } from "../controllers/artworkController.js";
import Busboy from "busboy";
import Release from "../models/Release.js";
import express from "express";
import fs from "fs";
import path from "path";
import requireLogin from "../middlewares/requireLogin.js";

const { TEMP_PATH } = process.env;
const router = express.Router();

router.post("/:releaseId", requireLogin, async (req, res) => {
  try {
    const { releaseId } = req.params;
    const io = req.app.get("socketio");
    const busboy = Busboy({ headers: req.headers, limits: { fileSize: 1024 * 1024 * 20 } });
    const userId = req.user._id;

    busboy.on("error", async error => {
      console.log(error);
      req.unpipe(busboy);
      res.status(400).json({ error: "Error. Could not upload this file." });
    });

    busboy.on("file", async (fieldName, file, info) => {
      if (fieldName !== "artworkImageFile") return res.sendStatus(403);
      const { filename, encoding, mimeType } = info;
      const releaseExists = await Release.exists({ _id: releaseId, user: userId });
      if (!releaseExists) await Release.create({ _id: releaseId, user: userId });
      const filePath = path.join(TEMP_PATH, releaseId);
      const write = fs.createWriteStream(filePath);
      file.pipe(write);
      write.on("finish", () => uploadArtwork({ userId, filePath, releaseId }, io));
    });

    busboy.on("finish", () => {
      if (!res.headersSent) res.end();
    });

    req.pipe(busboy);
  } catch (error) {
    console.log(error);
    res.status(400).send({ error: "Error. Could not upload this file" });
  }
});

router.delete("/:releaseId", requireLogin, async (req, res) => {
  try {
    const { releaseId } = req.params;
    const userId = req.user._id;
    const release = await Release.findOne({ _id: releaseId, user: userId }, "-__v").exec();
    if (!release) res.end();
    const updated = await deleteArtwork(releaseId, release);
    res.send(updated);
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
});

export default router;
