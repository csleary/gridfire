import { deleteTrack, logStream, uploadTrack } from "gridfire/controllers/trackController.js";
import express from "express";
import requireLogin from "gridfire/middlewares/requireLogin.js";

const router = express.Router();

router.put("/", requireLogin, async (req, res) => {
  try {
    const { headers, user } = req;
    const userId = user._id.toString();
    await uploadTrack({ headers, req, userId });
    res.sendStatus(200);
  } catch (error) {
    console.log(error);
    if (res.headersSent) return;
    res.sendStatus(error.status || 400);
  }
});

router.post("/:trackId/:type", async (req, res) => {
  try {
    const userId = req.user?._id || req.session.user;
    const { trackId, type } = req.params;
    const user = await logStream({ trackId, userId, type });
    req.session.user = user;
    res.sendStatus(200);
  } catch (error) {
    console.error(error);
    res.sendStatus(400);
  }
});

router.delete("/:trackId", requireLogin, async (req, res) => {
  try {
    const { trackId } = req.params;
    const userId = req.user._id;
    await deleteTrack(trackId, userId);
    res.sendStatus(200);
  } catch (error) {
    console.error(error);
    res.sendStatus(400);
  }
});

export default router;
