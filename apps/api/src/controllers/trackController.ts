import type { Readable } from "node:stream";

import { deleteObject, deleteObjects, streamToBucket } from "@gridfire/api/controllers/storage";
import { publishToQueue } from "@gridfire/shared/amqp";
import Logger from "@gridfire/shared/logger";
import Play from "@gridfire/shared/models/Play";
import Release from "@gridfire/shared/models/Release";
import Stream from "@gridfire/shared/models/Stream";
import sseClient from "@gridfire/shared/sseController";
import { MessageTrackStatus, MessageType } from "@gridfire/shared/types";
import Busboy from "busboy";
import { Request } from "express";
import mime from "mime-types";
import { MongoServerError } from "mongodb";
import { ObjectId, Types } from "mongoose";
import assert from "node:assert/strict";
import { IncomingHttpHeaders } from "node:http";
import { pipeline } from "node:stream/promises";

const { BUCKET_FLAC, BUCKET_MP3, BUCKET_MP4, BUCKET_SRC, QUEUE_TRANSCODE } = process.env;
const MIN_DURATION_FOR_PLAY = 25_000;
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
  logger.info(`[track ${trackId.toString()}] Deleting track…`);
  const objectKey = `${releaseId}/${trackId}`;

  const results = await Promise.allSettled([
    deleteObject(BUCKET_FLAC, objectKey),
    deleteObject(BUCKET_MP3, objectKey),
    deleteObject(BUCKET_SRC, objectKey),
    deleteObjects(BUCKET_MP4, objectKey)
  ]);

  results.forEach(result => {
    if (result.status === "rejected") {
      logger.error(`[track ${trackId.toString()}] Unabled to delete track files: ${result.reason}`);
    }
  });

  await Release.updateOne(
    { _id: releaseId, "trackList._id": trackId, user },
    { $pull: { trackList: { _id: trackId } } }
  ).exec();

  await Release.updateOne({ _id: releaseId, trackList: { $size: 0 }, user }, { published: false }).exec();
  logger.info(`[${trackId.toString()}] Track deleted.`);
};

const logPlay = async (trackId: string, release: string, streamId: string, user: string) => {
  logger.debug(`[${trackId}] Logging play…`);

  await Play.create({ date: Date.now(), release, trackId, user })
    .then(() => logger.debug(`[${trackId}] Play logged.`))
    .catch(error => logger.error(error));

  Stream.deleteOne({ _id: streamId }).exec();
};

const logStream = async ({ trackId, type, userId }: { trackId: string; type: string; userId?: ObjectId }) => {
  const release = await Release.findOne({ "trackList._id": trackId }, "trackList.$ user").exec();

  if (!release) {
    throw new Error("Release not found.");
  }

  const releaseId = release._id.toString();
  const user = userId?.toString() || new Types.ObjectId().toString();

  switch (Number.parseInt(type)) {
    case 0:
      logger.debug(`[${trackId}] Logging play time start.`);

      Stream.updateOne({ trackId, user }, { startTime: Date.now() }, { upsert: true })
        .exec()
        .catch((error: unknown) => {
          if (error instanceof MongoServerError && error.code === 11000) return;
          logger.error(error);
        });
      break;

    case 1: // Update total time on pause/stop.
      {
        const stream = await Stream.findOne({ trackId, user }).exec();
        if (!stream) break;
        logger.debug(`[${trackId}] Updating play time.`);

        Stream.updateOne(
          { trackId, user },
          { startTime: null, totalTimePlayed: stream.totalTimePlayed + Date.now() - stream.startTime }
        ).exec();
      }
      break;

    case 2:
      {
        const stream = await Stream.findOne({ trackId, user }).exec();
        if (!stream) break;
        logger.debug(`[${trackId}] Total play time: ${stream.totalTimePlayed + Date.now() - stream.startTime}ms.`);

        if (
          stream != null &&
          stream.startTime !== null &&
          stream.totalTimePlayed + Date.now() - stream.startTime > MIN_DURATION_FOR_PLAY
        ) {
          logPlay(trackId, releaseId, stream._id.toString(), user);
        }
      }
      break;

    default:
      break;
  }

  return user;
};

interface FileHandlerArgs {
  fields: FormDataFields;
  userId: string;
}

type FileStream = Readable & { truncated?: boolean };

interface FormDataFields {
  releaseId: string;
  trackId: string;
  trackTitle: string;
}

interface FormDataFileInfo {
  filename: string;
  mimeType: string;
}

const createAsyncFileHandler =
  ({ fields, userId }: FileHandlerArgs) =>
  async (fileStream: FileStream, { filename, mimeType }: FormDataFileInfo) => {
    const { releaseId, trackId, trackTitle = "" } = fields;
    const bucketKey = `${releaseId}/${trackId}`;
    const filter = { _id: releaseId, "trackList._id": trackId, user: userId };
    const extension = mime.extension(mimeType);

    const isAccepted =
      (typeof extension === "string" && ["aiff", "flac", "wav"].includes(extension)) ||
      ["audio/flac", "audio/x-flac"].includes(mimeType);

    if (!isAccepted) {
      throw new Error("File type not recognised. Needs to be flac/aiff/wav.");
    }

    logger.info(`Uploading src file ${filename} for track ${trackId}…`);

    // Update track if it already exists.
    const release = await Release.findOneAndUpdate(
      filter,
      { $set: { "trackList.$.status": "uploading", "trackList.$.trackTitle": trackTitle } },
      { new: true }
    ).lean();

    if (!release) {
      // If the release does not exist, add a new track.
      await Release.updateOne(
        { _id: releaseId, user: userId },
        {
          $addToSet: { trackList: { _id: trackId, status: "uploading", trackTitle } },
          $setOnInsert: { user: userId }
        },
        { upsert: true }
      ).exec();
    }

    const uploadingPayload: Omit<MessageTrackStatus, "userId"> = {
      releaseId,
      status: "uploading",
      trackId,
      type: MessageType.TrackStatus
    };

    sseClient.send(userId, uploadingPayload);
    await streamToBucket(BUCKET_SRC, bucketKey, fileStream);
    logger.info(`Uploaded src file '${filename}' for track ${trackId}.`);
    await Release.updateOne(filter, { $set: { "trackList.$.status": "uploaded" } }).exec();

    const uploadedPayload: Omit<MessageTrackStatus, "userId"> = {
      releaseId,
      status: "uploaded",
      trackId,
      type: MessageType.TrackStatus
    };

    sseClient.send(userId, uploadedPayload);

    publishToQueue("", QUEUE_TRANSCODE, {
      job: "encodeFLAC",
      releaseId,
      trackId,
      trackTitle,
      type: MessageType.Job,
      userId
    });
  };

const reEncodeTrack = async (userId: string, trackId: string) => {
  const release = await Release.findOne({ "trackList._id": trackId, user: userId }, { "trackList.$": 1 }).lean();

  if (!release) {
    throw new Error("Release not found.");
  }

  const releaseId = release._id.toString();
  const { trackList } = release;
  const [{ trackTitle = "" }] = trackList;

  await publishToQueue("", QUEUE_TRANSCODE, {
    job: "transcodeAAC",
    releaseId,
    trackId,
    trackTitle,
    type: MessageType.Job,
    userId
  });

  await publishToQueue("", QUEUE_TRANSCODE, {
    job: "transcodeMP3",
    releaseId,
    trackId,
    trackTitle,
    type: MessageType.Job,
    userId
  });
};

const uploadTrack = async ({
  headers,
  req,
  userId
}: {
  headers: IncomingHttpHeaders;
  req: Request;
  userId: string;
}): Promise<void> => {
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

export { deleteTrack, logStream, reEncodeTrack, uploadTrack };
