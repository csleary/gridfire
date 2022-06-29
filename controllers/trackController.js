import { decryptBuffer, encryptStream, encryptString } from "gridfire/controllers/encryption.js";
import Busboy from "busboy";
import Release from "gridfire/models/Release.js";
import StreamSession from "gridfire/models/StreamSession.js";
import User from "gridfire/models/User.js";
import mime from "mime-types";
import mongoose from "mongoose";
import { publishToQueue } from "gridfire/controllers/amqp/publisher.js";

const { ObjectId } = mongoose.Types;
const { QUEUE_TRANSCODE } = process.env;

const deleteTrack = async ({ trackId, userId: user, ipfs }) => {
  const release = await Release.findOneAndUpdate(
    { "trackList._id": trackId, user },
    { "trackList.$.status": "deleting" },
    { fields: { trackList: { _id: 1, cids: 1, mpd: 1 } }, lean: true, new: true }
  ).exec();

  if (!release) return;
  console.log(`[${trackId}] Deleting track…`);
  const { cids = {}, mpd } = release.trackList.find(({ _id }) => _id.equals(trackId)) || {};
  console.log(`[${trackId}] Unpinning MPD…`);
  await ipfs.pin.rm(mpd).catch(error => console.error(error.message));

  for (const cid of Object.values(cids).filter(Boolean)) {
    console.log(`[${trackId}] Unpinning CID ${cid}…`);
    await ipfs.pin.rm(cid).catch(error => console.error(error.message));
  }

  await Release.findOneAndUpdate(
    { "trackList._id": trackId, user },
    { $pull: { trackList: { _id: trackId } }, published: release.trackList.length === 1 ? false : release.status }
  ).exec();

  console.log(`[${trackId}] Track deleted.`);
};

const getInitSegment = async ({ trackId, userId }) => {
  const release = await Release.findOne({ "trackList._id": trackId }, "trackList.$ user").exec();
  const { _id: releaseId, trackList } = release || {};
  const { cids, duration, initRange, segmentList } = trackList.id(trackId);
  const cidMP4 = cids.mp4;

  // If user is not logged in, generate a session userId for play tracking (or use one already present in session from previous anonymous plays).
  // Return to add to session for future segment fetches.
  const user = userId || ObjectId();

  if (!release.user.equals(userId)) {
    StreamSession.create({ user, release: releaseId, trackId, segmentsTotal: segmentList.length }).catch(
      error => error.code != 11000 && console.error(error)
    );
  }

  return { duration, cid: cidMP4, range: initRange, user };
};

const getSegment = async ({ time, trackId, type, user }) => {
  const release = await Release.findOne({ "trackList._id": trackId }, "trackList.$ user").exec();
  const { cids, segmentList, segmentDuration, segmentTimescale } = release.trackList.id(trackId);
  const segmentTime = Number.parseFloat(time) / (segmentDuration / segmentTimescale);
  const indexLookup = { 0: 0, 1: Math.ceil(segmentTime), 2: Math.floor(segmentTime) };
  const index = indexLookup[type];
  const range = segmentList[index];
  const end = index + 1 === segmentList.length;

  if (!release.user.equals(user)) {
    StreamSession.findOneAndUpdate({ user, trackId }, { $inc: { segmentsFetched: 1 } }).exec();
  }

  return { cid: cids.mp4, range, end };
};

const getStreamKey = async ({ headers, privateKey, req }) => {
  const busboy = Busboy({ headers, limits: { fileSize: 1024 * 16 } });
  let publicKey;

  const parseForm = new Promise((resolve, reject) => {
    busboy.on("error", async error => {
      req.unpipe(busboy);
      reject(error);
    });

    busboy.on("field", async (name, value) => {
      if (name === "key") {
        publicKey = JSON.parse(value);
      }
    });

    busboy.on("file", async (name, file) => {
      try {
        if (name !== "message") {
          const error = new Error();
          error.status = 403;
          throw error;
        }

        const kidsBuffer = await new Promise((resolve, reject) => {
          const chunks = [];
          file.on("data", chunk => chunks.push(chunk));
          file.on("end", () => resolve(Buffer.concat(chunks)));
          file.on("error", reject);
        });

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
        resolve(cipherBuffer);
      } catch (error) {
        busboy.emit("error", error);
      }
    });
  });

  req.pipe(busboy);
  return parseForm;
};

const uploadTrack = async ({ headers, ipfs, req, sse, userId }) => {
  const formData = {};
  const busboy = Busboy({ headers, limits: { fileSize: 1024 * 1024 * 1024 } });

  const parseUpload = new Promise((resolve, reject) => {
    busboy.on("error", async error => {
      req.unpipe(busboy);
      reject(error);
    });

    busboy.on("field", (key, value) => {
      formData[key] = value;
    });

    busboy.on("file", async (fieldName, fileStream, { mimeType }) => {
      const { releaseId, trackId, trackName } = formData;

      try {
        if (fieldName !== "trackAudioFile") {
          const error = new Error();
          error.status = 403;
          throw error;
        }

        const isAccepted =
          ["aiff", "flac", "wav"].includes(mime.extension(mimeType)) ||
          ["audio/flac", "audio/x-flac"].includes(mimeType);

        if (!isAccepted) {
          throw new Error("File type not recognised. Needs to be flac/aiff/wav.");
        }

        const filter = { _id: releaseId, user: userId };
        const options = { new: true, upsert: true };
        const release = await Release.findOneAndUpdate(filter, {}, options).exec();
        const { key } = await User.findById(userId, "key", { lean: true }).exec();
        let track = release.trackList.id(trackId);

        if (track) {
          const {
            trackList: [{ cids, mpd }]
          } = await Release.findOne({ _id: releaseId, "trackList._id": trackId }, "trackList.$").exec();

          console.log("Unpinning existing track audio…");
          console.log(`Unpinning MPD CID ${mpd} for track ${trackId}…`);
          await ipfs.pin.rm(mpd).catch(error => console.error(error.message));

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
        resolve();
      } catch (error) {
        busboy.emit("error", error);
        fileStream.destroy();
      }
    });
  });

  req.pipe(busboy);
  return parseUpload;
};

export { deleteTrack, getInitSegment, getSegment, getStreamKey, uploadTrack };
