import Busboy from "busboy";
import Release from "../models/Release.js";
import StreamSession from "../models/StreamSession.js";
import aws from "aws-sdk";
import express from "express";
import mime from "mime-types";
import mongoose from "mongoose";
import { publishToQueue } from "../controllers/amqp/publisher.js";
import requireLogin from "../middlewares/requireLogin.js";

const { AWS_REGION, BUCKET_OPT, QUEUE_TRANSCODE } = process.env;
aws.config.update({ region: AWS_REGION });
const router = express.Router();

router.get("/:trackId/init", async (req, res) => {
  const { trackId } = req.params;
  const release = await Release.findOne({ "trackList._id": trackId }, "trackList.$ user").exec();
  const releaseId = release._id;
  const { duration, initRange, segmentList } = release.trackList.id(trackId);
  const mp4Params = { Bucket: BUCKET_OPT, Expires: 10, Key: `mp4/${releaseId}/${trackId}.mp4` };
  const s3 = new aws.S3();
  const url = s3.getSignedUrl("getObject", mp4Params);

  // If user is not logged in, generate a session userId for play tracking (or use one already present in session from previous anonymous plays).
  const user = req.user?._id || req.session.user || mongoose.Types.ObjectId();
  req.session.user = user;
  res.send({ duration, url, range: initRange });

  if (!release.user.equals(user)) {
    try {
      await StreamSession.create({
        user,
        release: releaseId,
        trackId,
        segmentsTotal: segmentList.length
      });
    } catch (error) {
      if (error.code === 11000) return;
      res.status(400).json({ error: error.message || error.toString() });
    }
  }
});

router.get("/:trackId/stream", async (req, res) => {
  try {
    const { trackId } = req.params;
    const { time, type } = req.query;
    const release = await Release.findOne({ "trackList._id": trackId }, "trackList.$ user").exec();
    const releaseId = release._id;
    const { segmentList, segmentDuration, segmentTimescale } = release.trackList.id(trackId);
    const segmentTime = Number.parseFloat(time) / (segmentDuration / segmentTimescale);
    const indexLookup = { 0: 0, 1: Math.ceil(segmentTime), 2: Math.floor(segmentTime) };
    const index = indexLookup[type];
    const range = segmentList[index];
    const end = index + 1 === segmentList.length;
    const mp4Params = { Bucket: BUCKET_OPT, Expires: 10, Key: `mp4/${releaseId}/${trackId}.mp4` };
    const s3 = new aws.S3();
    const url = s3.getSignedUrl("getObject", mp4Params);
    res.send({ url, range, end });

    // If user is not logged in, use the session userId for play tracking.
    const user = req.user?._id || req.session.user;

    if (!release.user.equals(user)) {
      await StreamSession.findOneAndUpdate({ user, trackId }, { $inc: { segmentsFetched: 1 } }, { new: true }).exec();
    }
  } catch (error) {
    console.log(error);
    res.status(400).json({ error: error.message || error.toString() });
  }
});

router.delete("/:releaseId/:trackId", requireLogin, async (req, res) => {
  try {
    const { releaseId, trackId } = req.params;
    const { ipfs } = req.app.locals;
    const user = req.user._id;
    const release = await Release.findOne({ _id: releaseId, user }).exec();
    if (!release) return res.sendStatus(403);
    const trackDoc = release.trackList.id(trackId);
    if (!trackDoc) return res.sendStatus(200);
    trackDoc.status = "deleting";
    await release.save();

    for (const cid in trackDoc.cids.toJSON()) {
      await ipfs.pin.rm(trackDoc.cids[cid]).catch(console.error);
    }

    release.trackList.id(trackId).remove();
    if (!release.trackList.length) release.published = false;
    const updatedRelease = await release.save();
    res.json(updatedRelease.toJSON());
  } catch (error) {
    console.log(error);
    res.status(400).json({ error: error.message || error.toString() });
  }
});

router.post("/:releaseId/upload", requireLogin, async (req, res) => {
  try {
    const { app, headers, params, user } = req;
    const { releaseId } = params;
    const { ipfs, sse } = app.locals;
    const userId = user._id.toString();
    const formData = {};
    const filter = { _id: releaseId, user: userId };
    const options = { new: true, upsert: true };
    const release = await Release.findOneAndUpdate(filter, {}, options).exec();
    const busboy = Busboy({ headers, limits: { fileSize: 1024 * 1024 * 200 } });

    busboy.on("error", async error => {
      console.log(error);
      req.unpipe(busboy);
      res.status(400).json({ error: "Error. Could not upload this file." });
    });

    busboy.on("field", (key, value) => {
      formData[key] = value;
    });

    busboy.on("file", async (fieldName, fileStream, { mimeType }) => {
      if (fieldName !== "trackAudioFile") return res.sendStatus(403);
      const { trackId, trackName } = formData;
      const accepted = ["aiff", "flac", "wav"].includes(mime.extension(mimeType));

      if (!accepted) {
        throw new Error("File type not recognised. Needs to be flac/aiff/wav.");
      }

      let track = release.trackList.id(trackId);

      if (track) {
        track.set({ dateUpdated: Date.now(), status: "uploading" });
      } else {
        release.trackList.addToSet({ _id: trackId, dateUpdated: Date.now(), status: "uploading" });
        track = release.trackList.id(trackId);
      }

      sse.send(userId, { type: "updateTrackStatus", releaseId, trackId, status: "uploading" });
      const ipfsFile = await ipfs.add({ content: fileStream }, { progress: progress => console.log(progress) });
      const cid = ipfsFile.cid.toString();
      track.set({ dateUpdated: Date.now(), status: "uploaded", cids: { source: cid } });
      await release.save();
      sse.send(userId, { type: "updateTrackStatus", releaseId, trackId, status: "uploaded" });

      if ([cid, releaseId, trackId, trackName, userId].includes(undefined)) {
        throw new Error("Job parameters missing.");
      }

      publishToQueue("", QUEUE_TRANSCODE, { userId, cid, job: "encodeFLAC", releaseId, trackId, trackName });
    });

    busboy.on("finish", () => {
      if (!res.headersSent) res.sendStatus(200);
    });

    req.pipe(busboy);
  } catch (error) {
    console.log(error);
    res.status(400).json({ error: "Error. Could not upload this file." });
  }
});

export default router;
