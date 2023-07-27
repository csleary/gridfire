import { ReleaseContext } from "gridfire-worker/types/index.js";
import { ffmpegEncodeFragmentedAAC, ffprobeGetTrackDuration } from "gridfire-worker/consumer/ffmpeg.js";
import { streamFromBucket, streamToBucket } from "gridfire-worker/controllers/storage.js";
import assert from "assert/strict";
import fs from "fs";
import mongoose from "mongoose";
import packageMP4 from "gridfire-worker/consumer/packageMP4.js";
import path from "path";
import { pipeline } from "node:stream/promises";
import postMessage from "gridfire-worker/consumer/postMessage.js";
import { randomUUID } from "crypto";

const { BUCKET_FLAC, BUCKET_MP4, TEMP_PATH } = process.env;
const Release = mongoose.model("Release");
const fsPromises = fs.promises;

assert(BUCKET_FLAC, "BUCKET_FLAC env var missing.");
assert(BUCKET_MP4, "BUCKET_MP4 env var missing.");
assert(TEMP_PATH, "TEMP_PATH env var missing.");

const transcodeAAC = async ({ releaseId, trackId, trackName, userId }: ReleaseContext) => {
  const inputPath = path.resolve(TEMP_PATH, randomUUID({ disableEntropyCache: true }));
  const outputPath = path.resolve(TEMP_PATH, randomUUID({ disableEntropyCache: true }));
  const outputDir = randomUUID({ disableEntropyCache: true });

  try {
    await Release.findOneAndUpdate(
      { _id: releaseId, "trackList._id": trackId },
      { "trackList.$.status": "transcoding" }
    ).exec();

    const srcStream = await streamFromBucket(BUCKET_FLAC, `${releaseId}/${trackId}`);
    await pipeline(srcStream, fs.createWriteStream(inputPath));
    console.log(`[${trackId}] Downloaded flac…`);
    postMessage({ type: "trackStatus", releaseId, trackId, status: "transcoding", userId });
    postMessage({ type: "transcodingStartedAAC", trackId, userId });

    // Probe for track duration.
    fs.accessSync(inputPath, fs.constants.R_OK);
    const metadata = await ffprobeGetTrackDuration(inputPath);

    // Transcode to AAC MP4.
    console.log(`[${trackId}] Transcoding flac to aac file: ${outputPath}…`);
    await ffmpegEncodeFragmentedAAC(fs.createReadStream(inputPath), outputPath);

    // Package MP4.
    fs.accessSync(outputPath, fs.constants.R_OK);
    await fsPromises.mkdir(path.resolve(TEMP_PATH, outputDir));
    console.log(`[${trackId}] Packaging mp4 files in dir: ${outputDir}…`);
    await packageMP4(outputPath, outputDir);

    // Upload packaged mp4 files.
    const files = await fsPromises.readdir(path.resolve(TEMP_PATH, outputDir));

    for (const file of files) {
      const mp4Stream = fs.createReadStream(path.resolve(TEMP_PATH, outputDir, file));
      await streamToBucket(BUCKET_MP4, `${releaseId}/${trackId}/${file}`, mp4Stream);
    }

    // Save track and clean up.
    await Release.findOneAndUpdate(
      { _id: releaseId, "trackList._id": trackId, user: userId },
      { "trackList.$.duration": metadata.format.duration }
    ).exec();

    postMessage({ type: "transcodingCompleteAAC", trackId, trackName, userId });
  } catch (error) {
    console.error(error);

    await Release.findOneAndUpdate(
      { _id: releaseId, "trackList._id": trackId },
      { "trackList.$.status": "error" }
    ).exec();

    postMessage({ type: "trackStatus", releaseId, trackId, status: "error", userId });
    postMessage({ type: "pipelineError", stage: "aac", trackId, userId });
    throw error;
  } finally {
    console.log("Removing temp AAC stage files:\n", inputPath, "\n", outputPath);

    await Promise.allSettled([
      fsPromises.unlink(inputPath),
      fsPromises.unlink(outputPath),
      fsPromises.rm(path.resolve(TEMP_PATH, outputDir), { recursive: true })
    ]);
  }
};

export default transcodeAAC;
