import type { IUser } from "@gridfire/shared/models/User";

import { zipDownload } from "@gridfire/api/controllers/archiveController";
import logger from "@gridfire/api/controllers/logger";
import requireLogin from "@gridfire/api/middlewares/requireLogin";
import Sale from "@gridfire/shared/models/Sale";
import { Router } from "express";

const router = Router();

router.get("/:purchaseId/:format", requireLogin, async (req, res) => {
  try {
    const { format, purchaseId } = req.params;
    const { _id: userId } = req.user as IUser;

    const sale = await Sale.findOne({ _id: purchaseId, user: userId })
      .populate({ path: "release", select: "+trackList.position" })
      .lean();

    if (!sale) return void res.sendStatus(403);
    const { editionId, release, type } = sale;
    if (!release) return void res.sendStatus(404);
    zipDownload({ editionId, format, release, res, type });
  } catch (error) {
    logger.error(error);
    res.sendStatus(403);
  }
});

export default router;
