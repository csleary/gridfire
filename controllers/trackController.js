/* eslint-disable indent */
import { deleteObject, deleteObjects, streamToBucket } from "gridfire/controllers/storage.js";
import Busboy from "busboy";
import Play from "gridfire/models/Play.js";
import Release from "gridfire/models/Release.js";
import StreamSession from "gridfire/models/StreamSession.js";
import mime from "mime-types";
import mongoose from "mongoose";
import { publishToQueue } from "gridfire/controllers/amqp/publisher.js";

const { BUCKET_FLAC, BUCKET_MP3, BUCKET_MP4, BUCKET_SRC, QUEUE_TRANSCODE } = process.env;
const MIN_DURATION = 1000 * 25;
const { ObjectId } = mongoose.Types;

const deleteTrack = async (trackId, user) => {
  const release = await Release.findOneAndUpdate(
    { "trackList._id": trackId, user },
    { "trackList.$.status": "deleting" },
    { fields: { _id: 1 }, lean: true, new: true }
  ).exec();

  if (!release) return;
  const { _id: releaseId } = release;
  console.log(`[${releaseId}] Deleting track: ${trackId}…`);
  const objectKey = `${releaseId}/${trackId}`;

  await Promise.all([
    deleteObject(BUCKET_FLAC, objectKey),
    deleteObject(BUCKET_MP3, objectKey),
    deleteObject(BUCKET_SRC, objectKey),
    deleteObjects(BUCKET_MP4, objectKey)
  ]);

  await Release.findOneAndUpdate({ "trackList._id": trackId, user }, { $pull: { trackList: { _id: trackId } } }).exec();
  await Release.findOneAndUpdate({ _id: releaseId, user, trackList: { $size: 0 } }, { published: false }).exec();
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
        .catch(error => {
          if (error.code === 11000) return;
          console.error(error);
        });
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

const uploadTrack = async ({ headers, req, sse, userId }) => {
  const formData = {};
  const busboy = Busboy({ headers, limits: { fileSize: 1 << 30 } });

  const parseUpload = new Promise((resolve, reject) => {
    busboy.on("error", async error => {
      req.unpipe(busboy);
      reject(error);
    });

    busboy.on("field", (key, value) => {
      formData[key] = value;
    });

    busboy.on("file", async (fieldName, fileStream, { filename, mimeType }) => {
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

        console.log(`Uploading src file ${filename} for track ${trackId}…`);
        const filter = { _id: releaseId, user: userId };
        const options = { new: true, upsert: true };
        const release = await Release.findOneAndUpdate(filter, {}, options).exec();
        let track = release.trackList.id(trackId);
        release.trackList.addToSet({ _id: trackId, dateUpdated: Date.now(), status: "uploading" });
        track = release.trackList.id(trackId);
        sse.send(userId, { type: "trackStatus", releaseId, trackId, status: "uploading" });
        await streamToBucket(BUCKET_SRC, `${releaseId}/${trackId}`, fileStream);
        console.log(`Uploaded src file ${filename} for track ${trackId}.`);
        track.set({ dateUpdated: Date.now(), status: "uploaded" });
        await release.save();
        sse.send(userId, { type: "trackStatus", releaseId, trackId, status: "uploaded" });

        if ([releaseId, trackId, trackName, userId].includes(undefined)) {
          throw new Error("Job parameters missing.");
        }

        publishToQueue("", QUEUE_TRANSCODE, { job: "encodeFLAC", releaseId, trackId, trackName, userId });
        resolve();
      } catch (error) {
        console.log(error);
        busboy.emit("error", error);
        fileStream.destroy();
      }
    });
  });

  req.pipe(busboy);
  return parseUpload;
};

export { deleteTrack, uploadTrack, logStream };
