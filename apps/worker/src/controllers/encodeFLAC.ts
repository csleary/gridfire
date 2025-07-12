import { Progress } from "@aws-sdk/lib-storage";
import { publishToQueue } from "@gridfire/shared/amqp";
import Logger from "@gridfire/shared/logger";
import Release from "@gridfire/shared/models/Release";
import { ReleaseContext, TrackContext } from "@gridfire/shared/types/index";
import { MessageType } from "@gridfire/shared/types/messages";
import { ffmpegEncodeFLAC } from "@gridfire/worker/controllers/ffmpeg";
import postMessage from "@gridfire/worker/controllers/postMessage";
import { deleteObject, streamFromBucket, streamToBucket } from "@gridfire/worker/controllers/storage";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import fs, { promises as fsPromises } from "node:fs";
import path from "node:path";
import { pipeline } from "node:stream/promises";

const { BUCKET_FLAC, BUCKET_SRC, QUEUE_TRANSCODE, TEMP_PATH } = process.env;
assert(BUCKET_FLAC, "BUCKET_FLAC env var missing.");
assert(BUCKET_SRC, "BUCKET_SRC env var missing.");
assert(TEMP_PATH, "TEMP_PATH env var missing.");
assert(QUEUE_TRANSCODE, "QUEUE_TRANSCODE env var missing.");
const logger = new Logger("encodeFLAC");

interface EncodingProgress {
  loaded: number;
  percent: number;
  total: number;
}

const onEncodingProgress =
  ({ trackId, userId }: TrackContext) =>
  ({ percent }: EncodingProgress) => {
    postMessage({ progress: Math.round(percent), trackId, type: MessageType.EncodingProgressFLAC, userId });
  };

const onStorageProgress =
  ({ trackId, userId }: TrackContext) =>
  ({ loaded = 0, total = 0 }: Progress) => {
    const progress = Math.floor((loaded / total) * 100);
    postMessage({ progress, trackId, type: MessageType.StoringProgressFLAC, userId });
  };

const encodeFLAC = async ({ releaseId, trackId, trackTitle, userId }: ReleaseContext) => {
  const bucketKey = `${releaseId}/${trackId}`;
  const filter = { _id: releaseId, "trackList._id": trackId, user: userId };
  let inputPath: string = "";
  let outputPath: string = "";

  try {
    await Release.updateOne(filter, { "trackList.$.status": "encoding" }).exec();
    const srcStream = await streamFromBucket(BUCKET_SRC, bucketKey);
    if (!srcStream) throw new Error("Source audio file stream not found.");
    inputPath = path.resolve(TEMP_PATH, randomUUID({ disableEntropyCache: true }));
    const streamToDisk = fs.createWriteStream(inputPath);
    await pipeline(srcStream, streamToDisk);
    outputPath = path.resolve(TEMP_PATH, randomUUID({ disableEntropyCache: true }));
    await ffmpegEncodeFLAC(inputPath, outputPath, onEncodingProgress({ trackId, userId }));
    fs.accessSync(outputPath, fs.constants.R_OK);
    const body = fs.createReadStream(outputPath);
    await streamToBucket(BUCKET_FLAC, bucketKey, body, onStorageProgress({ trackId, userId }));
    await Release.updateOne(filter, { "trackList.$.status": "encoded" }).exec();
    logger.info(`Removing SRC file: ${bucketKey}…`);
    await deleteObject(BUCKET_SRC, bucketKey);
    logger.info(`SRC file '${bucketKey}' removed from B2.`);
    publishToQueue("", QUEUE_TRANSCODE, { job: "transcodeAAC", releaseId, trackId, trackTitle, userId });
    publishToQueue("", QUEUE_TRANSCODE, { job: "transcodeMP3", releaseId, trackId, userId });
  } catch (error) {
    logger.error(error);
    await Release.updateOne(filter, { "trackList.$.status": "error" }).exec();
    postMessage({ releaseId, status: "error", trackId, type: MessageType.TrackStatus, userId });
    postMessage({ stage: "flac", trackId, type: MessageType.PipelineError, userId });
    throw error;
  } finally {
    logger.log("Removing temp FLAC stage files:\n", inputPath, "\n", outputPath);
    await Promise.allSettled([fsPromises.unlink(inputPath), fsPromises.unlink(outputPath)]);
  }
};

export default encodeFLAC;
