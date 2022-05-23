import Release from "gridfire/models/Release.js";
import Sale from "gridfire/models/Sale.js";
import User from "gridfire/models/User.js";
import express from "express";
import requireLogin from "gridfire/middlewares/requireLogin.js";
import { zipDownload } from "gridfire/controllers/archiveController.js";

const router = express.Router();

router.get("/:releaseId/:format", requireLogin, async (req, res) => {
  const { format, releaseId } = req.params;
  const userId = req.user._id;
  const hasPurchased = await Sale.exists({ user: userId, release: releaseId });
  if (!hasPurchased) res.status(401).send({ error: "Not authorised." });
  const { ipfs } = req.app.locals;

  const release = await Release.findById(
    { _id: releaseId, published: true },
    "artistName artwork releaseTitle trackList user",
    { lean: true }
  ).exec();

  if (!release) return res.sendStatus(404);
  const { key } = await User.findById(release.user, "key", { lean: true }).exec();
  zipDownload({ ipfs, key, release, res, format });
});

export default router;
