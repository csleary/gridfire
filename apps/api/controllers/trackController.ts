import { deleteObject, deleteObjects, streamToBucket } from "@gridfire/api/controllers/storage.js";
import { publishToQueue } from "@gridfire/shared/amqp/publisher.js";
import Release from "@gridfire/shared/models/Release.js";
import sseClient from "@gridfire/shared/sseController";
import { MessageType } from "@gridfire/shared/types/messages.js";
import assert from "assert/strict";
import Busboy from "busboy";
import { Request } from "express";
import { IncomingHttpHeaders } from "http";
import mime from "mime-types";
import { ObjectId, Types, model } from "mongoose";

const { BUCKET_FLAC, BUCKET_MP3, BUCKET_MP4, BUCKET_SRC, QUEUE_TRANSCODE } = process.env;
const MIN_DURATION = 1000 * 25;
const Play = model("Play");
const StreamSession = model("StreamSession");

assert(BUCKET_FLAC, "BUCKET_FLAC env var missing.");
assert(BUCKET_MP3, "BUCKET_MP3 env var missing.");
assert(BUCKET_MP4, "BUCKET_MP4 env var missing.");
assert(BUCKET_SRC, "BUCKET_SRC env var missing.");
assert(QUEUE_TRANSCODE, "QUEUE_TRANSCODE env var missing.");

const deleteTrack = async (trackId: string, user: ObjectId) => {
  const release = await Release.findOneAndUpdate(
    { "trackList._id": trackId, user },
    { "trackList.$.status": "deleting" },
    { fields: { _id: 1 }, new: true }
  ).exec();

  if (!release) return;
  const { _id: releaseId } = release.toJSON();
  console.log(`[${releaseId}] Deleting track: ${trackId.toString()}…`);
  const objectKey = `${releaseId}/${trackId}`;

  const results = await Promise.allSettled([
    deleteObject(BUCKET_FLAC, objectKey),
    deleteObject(BUCKET_MP3, objectKey),
    deleteObject(BUCKET_SRC, objectKey),
    deleteObjects(BUCKET_MP4, objectKey)
  ]);

  results.forEach(result => {
    if (result.status === "rejected") {
      console.error(`[${trackId.toString()}] Unabled to delete track files: ${result.reason}`);
    }
  });

  await Release.findOneAndUpdate({ "trackList._id": trackId, user }, { $pull: { trackList: { _id: trackId } } }).exec();
  await Release.findOneAndUpdate({ _id: releaseId, user, trackList: { $size: 0 } }, { published: false }).exec();
  console.log(`[${trackId.toString()}] Track deleted.`);
};

const logPlay = async (trackId: string, release: string, streamId: string, user: string) => {
  await Play.create({ date: Date.now(), trackId, release, user });
  await StreamSession.findByIdAndDelete(streamId).exec();
};

const logStream = async ({ trackId, userId, type }: { trackId: string; userId?: ObjectId; type: string }) => {
  const release = await Release.findOne({ "trackList._id": trackId }, "trackList.$ user").exec();

  if (!release) {
    throw new Error("Release not found.");
  }

  const releaseId = release._id.toString();
  const user = userId?.toString() || new Types.ObjectId().toString();

  switch (Number.parseInt(type)) {
    case 0:
      // console.log(`[${trackId}] Logging start of playback.`);
      StreamSession.findOneAndUpdate({ user, trackId }, { startTime: Date.now() }, { upsert: true })
        .exec()
        .catch((error: any) => {
          if (error.code === 11000) return;
          console.error(error);
        });
      break;
    case 1: // Update total time on pause/stop.
      {
        const stream = await StreamSession.findOne({ user, trackId }).exec();
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
        const stream = await StreamSession.findOne({ user, trackId }).exec();
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

const uploadTrack = async ({
  headers,
  req,
  userId
}: {
  headers: IncomingHttpHeaders;
  req: Request;
  userId: ObjectId;
}) => {
  const busboy = Busboy({ headers, limits: { fileSize: 1 << 30 } });
  const formData = { releaseId: "", trackId: "", trackName: "" };

  const parseUpload = new Promise((resolve, reject) => {
    busboy.on("error", async error => {
      req.unpipe(busboy);
      reject(error);
    });

    busboy.on("field", (key, value) => {
      formData[key as keyof typeof formData] = value;
    });

    busboy.on("file", async (fieldName, fileStream, { filename, mimeType }) => {
      const { releaseId, trackId, trackName } = formData;

      try {
        if (fieldName !== "trackAudioFile") {
          const error = { ...new Error(), status: 403 };
          throw error;
        }

        const extension = mime.extension(mimeType);

        const isAccepted =
          (typeof extension === "string" && ["aiff", "flac", "wav"].includes(extension)) ||
          ["audio/flac", "audio/x-flac"].includes(mimeType);

        if (!isAccepted) {
          throw new Error("File type not recognised. Needs to be flac/aiff/wav.");
        }

        console.log(`Uploading src file ${filename} for track ${trackId}…`);
        const filter = { _id: releaseId, user: userId };
        const options = { new: true, upsert: true };
        const release = await Release.findOneAndUpdate(filter, {}, options).exec();

        if (!release) {
          throw new Error("Release not found.");
        }

        let track = release.trackList.id(trackId);
        release.trackList.addToSet({ _id: trackId, dateUpdated: Date.now(), status: "uploading" });
        track = release.trackList.id(trackId)!;
        sseClient.send(userId.toString(), { type: MessageType.TrackStatus, releaseId, trackId, status: "uploading" });
        await streamToBucket(BUCKET_SRC, `${releaseId}/${trackId}`, fileStream);
        console.log(`Uploaded src file '${filename}' for track ${trackId}.`);
        track.set({ dateUpdated: Date.now(), status: "uploaded" });
        await release.save();
        sseClient.send(userId.toString(), { type: MessageType.TrackStatus, releaseId, trackId, status: "uploaded" });
        publishToQueue("", QUEUE_TRANSCODE, { job: "encodeFLAC", releaseId, trackId, trackName, userId });
        resolve(void 0);
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

export { deleteTrack, logStream, uploadTrack };
