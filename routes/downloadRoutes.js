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
  try {
    const { ipfs } = req.app.locals;
    const { format, purchaseId } = req.params;
    const userId = req.user._id;
    const isEdition = utils.isHexString(purchaseId);
    let release;

    if (isEdition) {
      const tx = await getTransaction(purchaseId);
      const { editionId, id } = tx.args; // 'editionId' from PurchaseEdition event, or 'id' from TransferSingle event.
      const edition = await getGridFireEdition(editionId || id);
      const { artist, releaseId } = edition;
      const account = utils.getAddress(artist);
      const projection = "artistName artwork releaseTitle trackList user";

      release = await Release.findById(releaseId, projection, { lean: true })
        .populate({ path: "user", model: User, options: { lean: true }, select: "account key" })
        .exec();

      // Check release user is the same as the
      if (account !== utils.getAddress(release.user.account)) {
        throw new Error("Edition and release artist address mismatch");
      }
    } else {
      const sale = await Sale.findOne({ user: userId, _id: purchaseId }).exec();
      if (!sale) return res.status(401).send({ error: "Not authorised." });

      if (sale.type === "single") {
        release = await Release.findOne(
          { "trackList._id": sale.release, published: true },
          "artistName artwork releaseTitle trackList.$ user",
          { lean: true }
        )
          .populate({ path: "user", model: User, options: { lean: true }, select: "key" })
          .exec();
      } else {
        release = await Release.findOne(
          { _id: sale.release, published: true },
          "artistName artwork releaseTitle trackList user",
          { lean: true }
        )
          .populate({ path: "user", model: User, options: { lean: true }, select: "key" })
          .exec();
      }
    }

    if (!release) return res.sendStatus(404);
    const { key } = release.user;

    zipDownload({ ipfs, key, release, res, format });
  } catch (error) {
    console.error(error);
    res.sendStatus(403);
  }
});

export default router;
