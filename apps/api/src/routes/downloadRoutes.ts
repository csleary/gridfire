import { zipDownload } from "@gridfire/api/controllers/archiveController";
import logger from "@gridfire/api/controllers/logger";
import { getTransaction } from "@gridfire/api/controllers/web3/index";
import requireLogin from "@gridfire/api/middlewares/requireLogin";
import Edition from "@gridfire/shared/models/Edition";
import Release from "@gridfire/shared/models/Release";
import Sale from "@gridfire/shared/models/Sale";
import type { IUser } from "@gridfire/shared/models/User";
import { isHexString, TransactionDescription } from "ethers";
import { Router } from "express";

const router = Router();

router.get("/:purchaseId/:format", requireLogin, async (req, res) => {
  try {
    const { format, purchaseId } = req.params;
    const { _id: userId } = req.user as IUser;
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

      if (!edition) {
        throw new Error("Edition not found.");
      }

      ({ release } = edition);
    } else {
      const sale = await Sale.findOne({ user: userId, _id: purchaseId }).exec();
      if (!sale) return void res.status(401).send({ error: "Not authorised." });

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

    if (!release) return void res.sendStatus(404);
    zipDownload({ isEdition, release, res, format });
  } catch (error) {
    logger.error(error);
    res.sendStatus(403);
  }
});

export default router;
