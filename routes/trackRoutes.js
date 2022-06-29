import {
  deleteTrack,
  getInitSegment,
  getSegment,
  getStreamKey,
  uploadTrack
} from "gridfire/controllers/trackController.js";
import express from "express";
import requireLogin from "gridfire/middlewares/requireLogin.js";

const router = express.Router();

router.get("/", async (req, res) => {
  const { publicJWK } = req.app.locals.crypto;
  res.json(publicJWK);
});

router.post("/", async (req, res) => {
  try {
    const { app, headers } = req;
    const { privateKey } = app.locals.crypto;
    const cipherBuffer = await getStreamKey({ headers, privateKey, req });
    res.send(cipherBuffer);
  } catch (error) {
    console.log(error);
    if (res.headersSent) return;
    res.sendStatus(error.status || 400);
  }
});

router.put("/", requireLogin, async (req, res) => {
  try {
    const { app, headers, user } = req;
    const { ipfs, sse } = app.locals;
    const userId = user._id.toString();
    await uploadTrack({ headers, ipfs, req, sse, userId });
    res.sendStatus(200);
  } catch (error) {
    console.log(error);
    if (res.headersSent) return;
    res.sendStatus(error.status || 400);
  }
});

router.get("/:trackId/init", async (req, res) => {
  try {
    const userId = req.user?._id || req.session.user;
    const { trackId } = req.params;
    const { duration, cid, range, user } = await getInitSegment({ trackId, userId });
    req.session.user = user;
    res.send({ duration, cid, range });
  } catch (error) {
    console.log(error);
    res.sendStatus(400);
  }
});

router.get("/:trackId/stream", async (req, res) => {
  try {
    const { trackId } = req.params;
    const { time, type } = req.query;
    const user = req.user?._id || req.session.user;
    const { cid, range, end } = await getSegment({ time, trackId, type, user });
    res.send({ cid, range, end });
  } catch (error) {
    console.log(error);
    res.sendStatus(400);
  }
});

router.delete("/:trackId", requireLogin, async (req, res) => {
  try {
    const { trackId } = req.params;
    const { ipfs } = req.app.locals;
    const userId = req.user._id;
    await deleteTrack({ trackId, userId, ipfs });
    res.sendStatus(200);
  } catch (error) {
    console.log(error);
    res.sendStatus(400);
  }
});

export default router;
