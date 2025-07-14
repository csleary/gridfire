import type { IUser } from "@gridfire/shared/models/User";

import { deleteArtwork, uploadArtwork } from "@gridfire/api/controllers/artworkController";
import logger from "@gridfire/api/controllers/logger";
import requireLogin from "@gridfire/api/middlewares/requireLogin";
import Release from "@gridfire/shared/models/Release";
import Busboy from "busboy";
import { Router } from "express";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { pipeline } from "node:stream/promises";

const { TEMP_PATH } = process.env;
assert(TEMP_PATH, "TEMP_PATH env var missing.");
const router = Router();

router.post("/:releaseId", requireLogin, async (req, res) => {
  try {
    const userId = (req.user as IUser)._id.toString();
    const { releaseId } = req.params;
    const busboy = Busboy({ headers: req.headers, limits: { fileSize: 1024 * 1024 * 20 } });
    const filePromises: Promise<void>[] = [];
    const abortController = new AbortController();
    const { signal } = abortController;

    busboy.on("error", async error => {
      logger.error(error);
      if (res.headersSent) return;
      res.status(400).json({ error: "Error. We were unable to store this file." });
      abortController.abort(signal);
    });

    busboy.on("file", async (fieldName, file, info) => {
      if (fieldName !== "artworkImageFile") return void res.sendStatus(403);
      const { encoding, filename, mimeType } = info;

      logger.info(
        `[release ${releaseId}] Uploading artwork: ${filename}, encoding: ${encoding}, mime type: ${mimeType}`
      );

      const releaseExists = await Release.exists({ _id: releaseId, user: userId });
      if (!releaseExists) await Release.create({ _id: releaseId, user: userId });
      const filePath = path.join(TEMP_PATH, releaseId);
      const write = fs.createWriteStream(filePath);
      await pipeline(file, write, { signal });
      filePromises.push(uploadArtwork({ filePath, releaseId, userId }));
    });

    busboy.on("finished", async () => {
      try {
        await Promise.all(filePromises);
        logger.info(`[${releaseId}] Artwork uploaded.`);
        if (res.headersSent) return;
        res.sendStatus(201);
      } catch (error) {
        busboy.emit("error", error);
      }
    });

    await pipeline(req, busboy, { signal });
  } catch (error) {
    logger.info(error);
    if (res.headersSent) return;
    res.status(400).send({ error: "Error. Could not upload this file" });
  }
});

router.delete("/:releaseId", requireLogin, async (req, res) => {
  try {
    const { releaseId } = req.params;
    const { _id: userId } = req.user as IUser;
    const releaseExists = await Release.findOne({ _id: releaseId, user: userId });
    if (!releaseExists) return void res.end();
    logger.info(`[release ${releaseId}] Deleting artwork…`);
    const updated = await deleteArtwork(releaseId);
    logger.info(`[release ${releaseId}] Artwork deleted successfully.`);
    res.send(updated);
  } catch (error) {
    logger.error(error);
    res.sendStatus(400);
  }
});

export default router;
