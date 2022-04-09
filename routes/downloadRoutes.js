import Release from "../models/Release.js";
import Sale from "../models/Sale.js";
import express from "express";
import requireLogin from "../middlewares/requireLogin.js";
import { zipDownload } from "../controllers/archiveController.js";

const router = express.Router();

router.get("/:releaseId/:format", requireLogin, async (req, res) => {
  const { format, releaseId } = req.params;
  const userId = req.user._id;
  const hasPurchased = await Sale.exists({ user: userId, release: releaseId });
  if (!hasPurchased) res.status(401).send({ error: "Not authorised." });
  const { ipfs } = req.app.locals;

  const release = await Release.findById(
    { _id: releaseId, published: true },
    "artistName artwork releaseTitle trackList",
    { lean: true }
  ).exec();

  if (!release) return res.sendStatus(404);
  zipDownload({ ipfs, release, res, format });
});

export default router;
