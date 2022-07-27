import { decryptBuffer, encryptStream, encryptString } from "gridfire/controllers/encryption.js";
import Busboy from "busboy";
import Play from "gridfire/models/Play.js";
import Release from "gridfire/models/Release.js";
import StreamSession from "gridfire/models/StreamSession.js";
import User from "gridfire/models/User.js";
import mime from "mime-types";
import mongoose from "mongoose";
import { publishToQueue } from "gridfire/controllers/amqp/publisher.js";
import { webcrypto } from "crypto";

const { ObjectId } = mongoose.Types;
const { QUEUE_TRANSCODE, STREAMING_PRIVATE_JWK } = process.env;

const deleteTrack = async ({ trackId, userId: user, ipfs }) => {
  const release = await Release.findOneAndUpdate(
    { "trackList._id": trackId, user },
    { "trackList.$.status": "deleting" },
    {
      fields: { trackList: { _id: 1, flac: 1, hls: 1, mst: 1, mp3: 1, mp4: 1, mpd: 1, src: 1 } },
      lean: true,
      new: true
    }
  ).exec();

  if (!release) return;
  console.log(`[${trackId}] Deleting track…`);
  const { flac, hls, mst, mp3, mp4, mpd, src } = release.trackList.find(({ _id }) => _id.equals(trackId)) || {};

  for (const [key, cid] of Object.entries({ flac, hls, mst, mp3, mp4, mpd, src }).filter(([, cid]) => Boolean(cid))) {
    console.log(`[${trackId}] Unpinning CID '${key}': ${cid}…`);
    await ipfs.pin.rm(cid).catch(error => console.error(error.message));
  }

  await Release.findOneAndUpdate(
    { "trackList._id": trackId, user },
    { $pull: { trackList: { _id: trackId } }, published: release.trackList.length === 1 ? false : release.status }
  ).exec();

  console.log(`[${trackId}] Track deleted.`);
};

const logPlay = async (trackId, release, streamId, user) => {
  await Play.create({ date: Date.now(), trackId, release, user });
  await StreamSession.findByIdAndDelete(streamId).exec();
};

const logStream = async ({ trackId, userId, type }) => {
  const release = await Release.findOne({ "trackList._id": trackId }, "trackList.$ user").exec();
  const user = userId || ObjectId();

  if (release.user.equals(user)) {
    return user;
  }

  const releaseId = release._id;

  if (Number.parseInt(type) === 2) {
    // Licence request, following the decoding of a 'pssh' media box.
    StreamSession.create({ user, trackId }).catch(error => error.code != 11000 && console.error(error));
  } else if (Number.parseInt(type) === 1) {
    // General segment request. Will only increment after creation, following licence request.
    const stream = await StreamSession.findOneAndUpdate(
      { user, trackId },
      { $inc: { segmentsFetched: 1 } },
      { new: true, lean: true }
    ).exec();

    if (stream?.segmentsFetched > 3) {
      // More than 30s played, so log play.
      logPlay(trackId, releaseId, stream._id, user);
    }
  } else if (Number.parseInt(type) === 6) {
    // Stream finished. Just in case the track was short, check if there's an outstanding session with at least 1 segment.
    const stream = await StreamSession.findOne({ user, segmentsFetched: { $gte: 1 }, trackId }).exec();

    if (stream) {
      logPlay(trackId, releaseId, stream._id, user);
    }
  }

  return user;
};

const getStreamKey = async ({ headers, req }) => {
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

        const format = "jwk";
        const keyData = JSON.parse(STREAMING_PRIVATE_JWK);
        const publicExponent = new Uint8Array([1, 0, 1]);
        const algorithm = { name: "RSA-OAEP", modulusLength: 4096, publicExponent, hash: "SHA-256" };
        const extractable = true;
        const keyUsages = ["decrypt"];
        const privateKey = await webcrypto.subtle.importKey(format, keyData, algorithm, extractable, keyUsages);
        const decrypted = decryptBuffer(kidsBuffer, privateKey);
        const message = JSON.parse(decrypted);
        const [kidBase64] = message.kids;
        const kid = Buffer.from(kidBase64, "base64url").toString("hex");
        const release = await Release.findOne({ "trackList.kid": kid }, "trackList.$", { lean: true }).exec();

        if (!release) {
          const error = new Error();
          error.status = 403;
          throw error;
        }

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
            trackList: [{ flac, hls, mst, mp3, mp4, mpd, src }]
          } = await Release.findOne({ _id: releaseId, "trackList._id": trackId }, "trackList.$").exec();

          console.log("Unpinning existing track audio…");
          for (const [key, cid] of Object.entries({ flac, hls, mst, mp3, mp4, mpd, src }).filter(([, cid]) =>
            Boolean(cid)
          )) {
            console.log(`[${trackId}] Unpinning CID '${key}': ${cid}…`);
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
        track.set({ dateUpdated: Date.now(), status: "uploaded", src: cid });
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

export { deleteTrack, getStreamKey, uploadTrack, logStream };
