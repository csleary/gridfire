import { deleteObject, deleteObjects, streamToBucket } from "@gridfire/api/controllers/storage";
import { publishToQueue } from "@gridfire/shared/amqp";
import Logger from "@gridfire/shared/logger";
import Release from "@gridfire/shared/models/Release";
import sseClient from "@gridfire/shared/sseController";
import { MessageType } from "@gridfire/shared/types/messages";
import Busboy from "busboy";
import { Request } from "express";
import mime from "mime-types";
import { ObjectId, Types, model } from "mongoose";
import assert from "node:assert/strict";
import { IncomingHttpHeaders } from "node:http";
import type { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

const { BUCKET_FLAC, BUCKET_MP3, BUCKET_MP4, BUCKET_SRC, QUEUE_TRANSCODE } = process.env;
const MIN_DURATION = 1000 * 25;
const Play = model("Play");
const StreamSession = model("StreamSession");
const logger = new Logger("trackController");

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
  ).lean();

  if (!release) return;
  const { _id: releaseId } = release;
  logger.info(`[${releaseId}] Deleting track: ${trackId.toString()}…`);
  const objectKey = `${releaseId}/${trackId}`;

  const results = await Promise.allSettled([
    deleteObject(BUCKET_FLAC, objectKey),
    deleteObject(BUCKET_MP3, objectKey),
    deleteObject(BUCKET_SRC, objectKey),
    deleteObjects(BUCKET_MP4, objectKey)
  ]);

  results.forEach(result => {
    if (result.status === "rejected") {
      logger.error(`[${trackId.toString()}] Unabled to delete track files: ${result.reason}`);
    }
  });

  await Release.updateOne(
    { _id: releaseId, "trackList._id": trackId, user },
    { $pull: { trackList: { _id: trackId } } }
  ).exec();

  await Release.updateOne({ _id: releaseId, user, trackList: { $size: 0 } }, { published: false }).exec();
  logger.info(`[${trackId.toString()}] Track deleted.`);
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
      // logger.info(`[${trackId}] Logging start of playback.`);
      StreamSession.findOneAndUpdate({ user, trackId }, { startTime: Date.now() }, { upsert: true })
        .exec()
        .catch((error: any) => {
          if (error.code === 11000) return;
          logger.error(error);
        });
      break;

    case 1: // Update total time on pause/stop.
      {
        const stream = await StreamSession.findOne({ user, trackId }).exec();
        if (!stream) break;
        // logger.info(`[${trackId}] Updating playback time.`);

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
        // logger.info(`[${trackId}] Total playback time: ${stream.totalTimePlayed + Date.now() - stream.startTime}ms.`);

        if (
          stream != null &&
          stream.startTime !== null &&
          stream.totalTimePlayed + Date.now() - stream.startTime > MIN_DURATION
        ) {
          logger.info(`[${trackId}] Logging play.`);
          logPlay(trackId, releaseId, stream._id, user);
        }
      }
      break;

    default:
      break;
  }

  return user;
};

const createAsyncFileHandler =
  ({ fields, userId }: { fields: { releaseId: string; trackId: string; trackTitle: string }; userId: ObjectId }) =>
  async (
    fileStream: Readable & { truncated?: boolean },
    { filename, mimeType }: { filename: string; mimeType: string }
  ) => {
    const { releaseId, trackId, trackTitle = "" } = fields;
    const extension = mime.extension(mimeType);

    const isAccepted =
      (typeof extension === "string" && ["aiff", "flac", "wav"].includes(extension)) ||
      ["audio/flac", "audio/x-flac"].includes(mimeType);

    if (!isAccepted) {
      throw new Error("File type not recognised. Needs to be flac/aiff/wav.");
    }

    logger.info(`Uploading src file ${filename} for track ${trackId}…`);
    const filter = { _id: releaseId, "trackList._id": trackId, user: userId };

    // Update track if it already exists.
    const release = await Release.findOneAndUpdate(
      filter,
      { $set: { "trackList.$.trackTitle": trackTitle, "trackList.$.status": "uploading" } },
      { new: true }
    ).lean();

    if (!release) {
      // If the release does not exist, add a new track.
      await Release.updateOne(
        { _id: releaseId, user: userId },
        {
          $setOnInsert: { user: userId },
          $addToSet: { trackList: { _id: trackId, trackTitle, status: "uploading" } }
        },
        { upsert: true }
      ).exec();
    }

    sseClient.send(userId.toString(), { type: MessageType.TrackStatus, releaseId, trackId, status: "uploading" });
    await streamToBucket(BUCKET_SRC, `${releaseId}/${trackId}`, fileStream);
    logger.info(`Uploaded src file '${filename}' for track ${trackId}.`);
    await Release.updateOne(filter, { $set: { "trackList.$.status": "uploaded" } }).exec();
    sseClient.send(userId.toString(), { type: MessageType.TrackStatus, releaseId, trackId, status: "uploaded" });
    publishToQueue("", QUEUE_TRANSCODE, { job: "encodeFLAC", releaseId, trackId, trackTitle, userId });
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
  const fields = { releaseId: "", trackId: "", trackTitle: "" };
  const filePromises: Promise<void>[] = [];
  const processFile = createAsyncFileHandler({ fields, userId });
  const abortController = new AbortController();
  const { signal } = abortController;

  busboy.on("error", async error => {
    logger.error(error);
    abortController.abort();
  });

  busboy.on("field", (key, value) => {
    fields[key as keyof typeof fields] = value;
  });

  busboy.on("file", async (fieldName, fileStream, { filename, mimeType }) => {
    if (fieldName !== "trackAudioFile") {
      busboy.emit("error", new Error("Invalid field name.", { cause: { status: 403 } }));
      return;
    }

    filePromises.push(processFile(fileStream, { filename, mimeType }));
  });

  busboy.on("finished", async () => {
    try {
      await Promise.all(filePromises);
    } catch (error) {
      busboy.emit("error", error);
    }
  });

  await pipeline(req, busboy, { signal });
};

export { deleteTrack, logStream, uploadTrack };
