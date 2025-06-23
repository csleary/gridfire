import { deleteTrack, logStream, uploadTrack } from "@gridfire/api/controllers/trackController";
import requireLogin from "@gridfire/api/middlewares/requireLogin";
import express from "express";

const router = express.Router();

router.put("/", requireLogin, async (req, res) => {
  try {
    const { headers, user } = req;
    const { _id: userId } = user || {};
    if (!userId) return void res.sendStatus(401);
    await uploadTrack({ headers, req, userId });
    res.sendStatus(200);
  } catch (error: any) {
    console.log(error);
    if (res.headersSent) return;
    res.sendStatus(error.status || 400);
  }
});

router.post("/:trackId/:type", async (req, res) => {
  try {
    const userId = req.user?._id || req.session?.user;
    const { trackId, type } = req.params;
    const user = await logStream({ trackId, userId, type });

    if (req.session) {
      req.session.user = user;
    }

    res.sendStatus(200);
  } catch (error) {
    console.error(error);
    res.sendStatus(400);
  }
});

router.delete("/:trackId", requireLogin, async (req, res) => {
  try {
    const { params, user } = req;
    const { trackId } = params;
    const { _id: userId } = user || {};
    if (!userId) return void res.sendStatus(401);
    await deleteTrack(trackId, userId);
    res.sendStatus(200);
  } catch (error) {
    console.error(error);
    res.sendStatus(400);
  }
});

export default router;
