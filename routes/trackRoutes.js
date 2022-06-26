import { decryptBuffer, encryptStream, encryptString } from "gridfire/controllers/encryption.js";
import Busboy from "busboy";
import Release from "gridfire/models/Release.js";
import StreamSession from "gridfire/models/StreamSession.js";
import User from "gridfire/models/User.js";
import express from "express";
import mime from "mime-types";
import mongoose from "mongoose";
import { publishToQueue } from "gridfire/controllers/amqp/publisher.js";
import requireLogin from "gridfire/middlewares/requireLogin.js";

const { QUEUE_TRANSCODE } = process.env;
const { ObjectId } = mongoose.Types;
const router = express.Router();

router.get("/", async (req, res) => {
  const { publicJWK } = req.app.locals.crypto;
  res.json(publicJWK);
});

router.post("/", async (req, res) => {
  try {
    const { headers } = req;
    const busboy = Busboy({ headers, limits: { fileSize: 1024 * 16 } });
    let publicKey;

    busboy.on("error", async error => {
      console.log(error);
      req.unpipe(busboy);
      if (res.headersSent) return;
      res.sendStatus(400);
    });

    busboy.on("field", async (name, value) => {
      if (name === "key") {
        publicKey = JSON.parse(value);
      }
    });

    busboy.on("file", async (name, file) => {
      try {
        if (name !== "message") {
          throw new Error("Internal error.");
        }

        const kidsBuffer = await new Promise((resolve, reject) => {
          const chunks = [];
          file.on("data", chunk => chunks.push(chunk));
          file.on("end", () => resolve(Buffer.concat(chunks)));
          file.on("error", reject);
        });

        const { privateKey } = req.app.locals.crypto;
        const decrypted = decryptBuffer(kidsBuffer, privateKey);
        const message = JSON.parse(decrypted);
        const [kidBase64] = message.kids;
        const kid = Buffer.from(kidBase64, "base64url").toString("hex");
        const release = await Release.findOne({ "trackList.kid": kid }, "trackList.$", { lean: true }).exec();
        const [track] = release.trackList;
        const { key } = track;

        const keysObj = {
          keys: [{ kty: "oct", k: Buffer.from(key, "hex").toString("base64url"), kid: kidBase64 }],
          type: "temporary"
        };

        const cipherBuffer = await encryptString(JSON.stringify(keysObj), publicKey);
        res.send(cipherBuffer);
      } catch (error) {
        busboy.emit("error", error);
      }
    });

    req.pipe(busboy);
  } catch (error) {
    console.log(error);
    if (res.headersSent) return;
    res.sendStatus(400);
  }
});

router.get("/:trackId/init", async (req, res) => {
  try {
    const { trackId } = req.params;
    const release = await Release.findOne({ "trackList._id": trackId }, "trackList.$ user").exec();
    const releaseId = release._id;
    const { cids, duration, initRange, segmentList } = release.trackList.id(trackId);
    const cidMP4 = cids.mp4;

    // If user is not logged in, generate a session userId for play tracking (or use one already present in session from previous anonymous plays).
    const user = req.user?._id || req.session.user || ObjectId();
    req.session.user = user;
    res.send({ duration, cid: cidMP4, range: initRange });

    if (!release.user.equals(user)) {
      try {
        await StreamSession.create({ user, release: releaseId, trackId, segmentsTotal: segmentList.length });
      } catch (error) {
        if (error.code === 11000) return;
        res.status(400).json({ error: error.message || error.toString() });
      }
    }
  } catch (error) {
    console.log(error);
    res.sendStatus(400);
  }
});

router.get("/:trackId/stream", async (req, res) => {
  try {
    const { trackId } = req.params;
    const { time, type } = req.query;
    const release = await Release.findOne({ "trackList._id": trackId }, "trackList.$ user").exec();
    const { cids, segmentList, segmentDuration, segmentTimescale } = release.trackList.id(trackId);
    const segmentTime = Number.parseFloat(time) / (segmentDuration / segmentTimescale);
    const indexLookup = { 0: 0, 1: Math.ceil(segmentTime), 2: Math.floor(segmentTime) };
    const index = indexLookup[type];
    const range = segmentList[index];
    const end = index + 1 === segmentList.length;
    res.send({ cid: cids.mp4, range, end });

    // If user is not logged in, use the session userId for play tracking.
    const user = req.user?._id || req.session.user;

    if (!release.user.equals(user)) {
      await StreamSession.findOneAndUpdate({ user, trackId }, { $inc: { segmentsFetched: 1 } }).exec();
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

    const release = await Release.findOneAndUpdate(
      { _id: releaseId, user, "trackList._id": trackId },
      { "trackList.$.status": "deleting" },
      { fields: { trackList: { _id: 1, cids: 1 } }, lean: true, new: true }
    ).exec();

    if (!release) return res.sendStatus(404);
    console.log(`Deleting track ${trackId}…`);
    const { cids = {} } = release.trackList.find(({ _id }) => _id.equals(trackId)) || {};

    for (const cid of Object.values(cids).filter(Boolean)) {
      console.log(`Unpinning CID ${cid} for track ${trackId}…`);
      await ipfs.pin.rm(cid).catch(error => console.error(error.message));
    }

    await Release.findOneAndUpdate(
      { _id: releaseId, user, "trackList._id": trackId },
      {
        $pull: { trackList: { _id: trackId } },
        published: release.trackList.length === 1 ? false : release.status
      }
    ).exec();

    console.log(`Track ${trackId} deleted.`);
    res.sendStatus(200);
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
    const { key } = await User.findById(userId, "key", { lean: true }).exec();
    const busboy = Busboy({ headers, limits: { fileSize: 1024 * 1024 * 200 } });

    busboy.on("error", async error => {
      console.log(error);
      req.unpipe(busboy);
      if (res.headersSent) return;
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
        const {
          trackList: [{ cids }]
        } = await Release.findOne({ _id: releaseId, "trackList._id": trackId }, "trackList.$").exec();

        console.log("Unpinning existing track audio…");
        for (const cid of Object.values(cids).filter(Boolean)) {
          console.log(`Unpinning CID ${cid} for track ${trackId}…`);
          await ipfs.pin.rm(cid).catch(error => console.error(error.message));
        }

        track.set({ dateUpdated: Date.now(), status: "uploading" });
      } else {
        release.trackList.addToSet({ _id: trackId, dateUpdated: Date.now(), status: "uploading" });
        track = release.trackList.id(trackId);
      }

      sse.send(userId, { type: "trackStatus", releaseId, trackId, status: "uploading" });

      try {
        const encryptedStream = encryptStream(fileStream, key);
        const ipfsFile = await ipfs.add(encryptedStream, { cidVersion: 1 });
        const cid = ipfsFile.cid.toString();
        track.set({ dateUpdated: Date.now(), status: "uploaded", cids: { src: cid } });
        await release.save();
        sse.send(userId, { type: "trackStatus", releaseId, trackId, status: "uploaded" });

        if ([releaseId, trackId, trackName, userId].includes(undefined)) {
          throw new Error("Job parameters missing.");
        }

        publishToQueue("", QUEUE_TRANSCODE, { job: "encodeFLAC", releaseId, trackId, trackName, userId });
      } catch (error) {
        busboy.emit("error", error);
        fileStream.destroy();
      }
    });

    busboy.on("finish", () => {
      if (!res.headersSent) res.sendStatus(200);
    });

    req.pipe(busboy);
  } catch (error) {
    console.log(error);
    if (res.headersSent) return;
    res.status(400).json({ error: "Error. Could not upload this file." });
  }
});

export default router;
