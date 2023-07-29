import express from "express";
import { getTransaction } from "gridfire/controllers/web3/index.js";
import { isHexString, TransactionDescription } from "ethers";
import mongoose from "mongoose";
import requireLogin from "gridfire/middlewares/requireLogin.js";
import { zipDownload } from "gridfire/controllers/archiveController.js";

const Edition = mongoose.model("Edition");
const Release = mongoose.model("Release");
const Sale = mongoose.model("Sale");
const router = express.Router();

router.get("/:purchaseId/:format", requireLogin, async (req, res) => {
  try {
    const { format, purchaseId } = req.params;
    const { _id: userId } = req.user || {};
    const isEdition = isHexString(purchaseId);
    let release;

    if (isEdition) {
      const tx = (await getTransaction(purchaseId)) as TransactionDescription;
      const { editionId, id } = tx.args; // 'editionId' from PurchaseEdition event, or 'id' from TransferSingle event.

      const edition = await Edition.findOne({ editionId: editionId || id })
        .populate({
          path: "release",
          model: Release,
          options: {
            lean: true,
            select: "artistName artwork releaseTitle trackList"
          }
        })
        .exec();

      ({ release } = edition);
    } else {
      const sale = await Sale.findOne({ user: userId, _id: purchaseId }).exec();
      if (!sale) return res.status(401).send({ error: "Not authorised." });

      if (sale.type === "single") {
        release = await Release.findOne(
          { "trackList._id": sale.release, published: true },
          "artistName artwork releaseTitle trackList.$",
          { lean: true }
        ).exec();
      } else {
        release = await Release.findOne(
          { _id: sale.release, published: true },
          "artistName artwork releaseTitle trackList",
          { lean: true }
        ).exec();
      }
    }

    if (!release) return res.sendStatus(404);
    zipDownload({ isEdition, release, res, format });
  } catch (error) {
    console.error(error);
    res.sendStatus(403);
  }
});

export default router;
