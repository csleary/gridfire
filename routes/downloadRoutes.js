import { getGridFireEdition, getTransaction } from "gridfire/controllers/web3/index.js";
import Release from "gridfire/models/Release.js";
import Sale from "gridfire/models/Sale.js";
import User from "gridfire/models/User.js";
import express from "express";
import requireLogin from "gridfire/middlewares/requireLogin.js";
import { utils } from "ethers";
import { zipDownload } from "gridfire/controllers/archiveController.js";

const router = express.Router();

router.get("/:purchaseId/:format", requireLogin, async (req, res) => {
  const { ipfs } = req.app.locals;
  const { format, purchaseId } = req.params;
  const userId = req.user._id;
  const isEdition = utils.isHexString(purchaseId);
  let release;

  if (isEdition) {
    const tx = await getTransaction(purchaseId);
    const { editionId } = tx.args;
    const edition = await getGridFireEdition(editionId);
    const { releaseId } = edition;

    release = await Release.findOne(
      { _id: releaseId, published: true },
      "artistName artwork releaseTitle trackList user",
      { lean: true }
    ).exec();
  } else {
    const sale = await Sale.findOne({ user: userId, _id: purchaseId }).exec();
    if (!sale) return res.status(401).send({ error: "Not authorised." });

    if (sale.type === "single") {
      release = await Release.findOne(
        { "trackList._id": sale.release, published: true },
        "artistName artwork releaseTitle trackList.$ user",
        { lean: true }
      ).exec();
    } else {
      release = await Release.findOne(
        { _id: sale.release, published: true },
        "artistName artwork releaseTitle trackList user",
        { lean: true }
      ).exec();
    }
  }

  if (!release) return res.sendStatus(404);
  const { key } = await User.findById(release.user, "key", { lean: true }).exec();
  zipDownload({ ipfs, key, release, res, format });
});

export default router;
