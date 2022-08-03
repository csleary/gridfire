import { encryptStream } from "gridfire/controllers/encryption.js";
import Busboy from "busboy";
import Play from "gridfire/models/Play.js";
import Release from "gridfire/models/Release.js";
import StreamSession from "gridfire/models/StreamSession.js";
import User from "gridfire/models/User.js";
import mime from "mime-types";
import mongoose from "mongoose";
import { publishToQueue } from "gridfire/controllers/amqp/publisher.js";

const { ObjectId } = mongoose.Types;
const { QUEUE_TRANSCODE } = process.env;
const MIN_DURATION = 1000 * 25;

const deleteTrack = async ({ trackId, userId: user, ipfs }) => {
  const release = await Release.findOneAndUpdate(
    { "trackList._id": trackId, user },
    { "trackList.$.status": "deleting" },
    {
      fields: { trackList: { _id: 1, flac: 1, mp3: 1, mp4: 1, src: 1 } },
      lean: true,
      new: true
    }
  ).exec();

  if (!release) return;
  console.log(`[${trackId}] Deleting track…`);
  const releaseId = release._id;
  const { flac, mp3, src } = release.trackList.find(({ _id }) => _id.equals(trackId)) || {};

  for (const [key, cid] of Object.entries({ flac, mp3, src }).filter(([, cid]) => Boolean(cid))) {
    console.log(`[${trackId}] Unpinning CID '${key}': ${cid}…`);
    await ipfs.pin.rm(cid).catch(error => console.error(error.message));
  }

  console.log(`[${trackId}] Deleting IPFS stream files…`);
  await ipfs.files
    .rm(`/${releaseId}/${trackId}`, { recursive: true, flush: true, cidVersion: 1 })
    .catch(error => console.error(error.message));

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
  const releaseId = release._id;
  const user = userId || ObjectId();

  if (release.user.equals(user)) {
    return user;
  }

  switch (Number.parseInt(type)) {
    case 0:
      // console.log(`[${trackId}] Logging start of playback.`);
      StreamSession.findOneAndUpdate({ user, trackId }, { startTime: Date.now() }, { upsert: true })
        .exec()
        .catch(error => error.code !== 11000 && console.error(error));
      break;
    case 1: // Update total time on pause/stop.
      {
        const stream = await StreamSession.findOne({ user, trackId }, "", { lean: true }).exec();
        if (!stream) break;
        // console.log(`[${trackId}] Updating playback time.`);

        StreamSession.findOneAndUpdate(
          { user, trackId },
          { totalTimePlayed: stream.totalTimePlayed + Date.now() - stream.startTime, startTime: null }
        ).exec();
      }
      break;
    case 2:
      {
        const stream = await StreamSession.findOne({ user, trackId }, "", { lean: true }).exec();
        if (!stream) break;
        // console.log(`[${trackId}] Total playback time: ${stream.totalTimePlayed + Date.now() - stream.startTime}ms.`);

        if (
          stream != null &&
          stream.startTime !== null &&
          stream.totalTimePlayed + Date.now() - stream.startTime > MIN_DURATION
        ) {
          console.log(`[${trackId}] Logging play.`);
          logPlay(trackId, releaseId, stream._id, user);
        }
      }
      break;
    default:
      break;
  }

  return user;
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
            trackList: [{ flac, mp3, src }]
          } = await Release.findOne({ _id: releaseId, "trackList._id": trackId }, "trackList.$").exec();

          console.log("Unpinning existing track audio…");
          for (const [key, cid] of Object.entries({ flac, mp3, src }).filter(([, cid]) => Boolean(cid))) {
            console.log(`[${trackId}] Unpinning CID '${key}': ${cid}…`);
            await ipfs.pin.rm(cid).catch(error => console.error(error.message));
          }

          console.log(`[${trackId}] Deleting IPFS stream files…`);
          await ipfs.files
            .rm(`/${releaseId}/${trackId}`, { recursive: true, flush: true, cidVersion: 1 })
            .catch(error => console.error(error.message));

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

export { deleteTrack, uploadTrack, logStream };
