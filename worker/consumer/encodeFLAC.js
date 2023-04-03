/* eslint-disable indent */
import { deleteObject, streamFromBucket, streamToBucket } from "gridfire-worker/controllers/storage.js";
import { ffmpegEncodeFLAC } from "gridfire-worker/consumer/ffmpeg.js";
import fs from "fs";
import mongoose from "mongoose";
import path from "path";
import { pipeline } from "node:stream/promises";
import postMessage from "gridfire-worker/consumer/postMessage.js";
import { publishToQueue } from "gridfire-worker/publisher/index.js";
import { randomUUID } from "crypto";

const { BUCKET_FLAC, BUCKET_SRC, TEMP_PATH, QUEUE_TRANSCODE } = process.env;
const Release = mongoose.model("Release");
const fsPromises = fs.promises;

const onEncodingProgress =
  ({ trackId, userId }) =>
  ({ percent }) => {
    postMessage({ type: "encodingProgressFLAC", progress: Math.round(percent), trackId, userId });
  };

const onStorageProgress =
  ({ trackId, userId }) =>
  ({ loaded, total }) => {
    const progress = Math.floor((loaded / total) * 100);
    postMessage({ type: "storingProgressFLAC", progress, trackId, userId });
  };

const encodeFLAC = async ({ releaseId, trackId, trackName, userId }) => {
  let inputPath, outputPath;

  try {
    await Release.findOneAndUpdate(
      { _id: releaseId, "trackList._id": trackId },
      { "trackList.$.status": "encoding" },
      { fields: "trackList.$", lean: true }
    ).exec();

    const srcStream = await streamFromBucket(BUCKET_SRC, `${releaseId}/${trackId}`);
    inputPath = path.resolve(TEMP_PATH, randomUUID({ disableEntropyCache: true }));
    const streamToDisk = fs.createWriteStream(inputPath);
    await pipeline(srcStream, streamToDisk);
    outputPath = path.resolve(TEMP_PATH, randomUUID({ disableEntropyCache: true }));
    await ffmpegEncodeFLAC(inputPath, outputPath, onEncodingProgress({ trackId, userId }));
    fs.accessSync(outputPath, fs.constants.R_OK);
    const key = `${releaseId}/${trackId}`;
    const body = fs.createReadStream(outputPath);
    await streamToBucket(BUCKET_FLAC, key, body, onStorageProgress({ trackId, userId }));

    await Release.findOneAndUpdate(
      { _id: releaseId, "trackList._id": trackId },
      { "trackList.$.status": "encoded" }
    ).exec();

    await deleteObject(BUCKET_SRC, `${releaseId}/${trackId}`);
    publishToQueue("", QUEUE_TRANSCODE, { job: "transcodeAAC", releaseId, trackId, trackName, userId });
    publishToQueue("", QUEUE_TRANSCODE, { job: "transcodeMP3", releaseId, trackId, userId });
  } catch (error) {
    console.error(error);

    await Release.findOneAndUpdate(
      { _id: releaseId, "trackList._id": trackId },
      { "trackList.$.status": "error", "trackList.$.dateUpdated": Date.now() }
    ).exec();

    postMessage({ type: "trackStatus", releaseId, trackId, status: "error", userId });
    postMessage({ type: "pipelineError", stage: "flac", trackId, userId });
    throw error;
  } finally {
    console.log("Removing temp FLAC stage files:\n", inputPath, "\n", outputPath);
    await Promise.allSettled([fsPromises.unlink(inputPath), fsPromises.unlink(outputPath)]);
  }
};

export default encodeFLAC;
