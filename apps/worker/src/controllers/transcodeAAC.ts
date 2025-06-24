import { ReleaseContext } from "@gridfire/shared/types/index";
import { MessageType } from "@gridfire/shared/types/messages";
import { ffmpegEncodeFragmentedAAC, ffprobeGetTrackDuration } from "@gridfire/worker/controllers/ffmpeg";
import packageMP4 from "@gridfire/worker/controllers/packageMP4";
import postMessage from "@gridfire/worker/controllers/postMessage";
import { streamFromBucket, streamToBucket } from "@gridfire/worker/controllers/storage";
import mongoose from "mongoose";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { pipeline } from "node:stream/promises";

const { BUCKET_FLAC, BUCKET_MP4, TEMP_PATH } = process.env;
const Release = mongoose.model("Release");
const fsPromises = fs.promises;

assert(BUCKET_FLAC, "BUCKET_FLAC env var missing.");
assert(BUCKET_MP4, "BUCKET_MP4 env var missing.");
assert(TEMP_PATH, "TEMP_PATH env var missing.");

const transcodeAAC = async ({ releaseId, trackId, trackTitle, userId }: ReleaseContext) => {
  const bucketKey = `${releaseId}/${trackId}`;
  const filter = { _id: releaseId, "trackList._id": trackId, user: userId };
  const inputPath = path.resolve(TEMP_PATH, randomUUID({ disableEntropyCache: true }));
  const outputPath = path.resolve(TEMP_PATH, randomUUID({ disableEntropyCache: true }));
  const outputDir = randomUUID({ disableEntropyCache: true });

  try {
    await Release.updateOne(filter, { "trackList.$.status": "transcoding" }).exec();
    const srcStream = await streamFromBucket(BUCKET_FLAC, bucketKey);
    await pipeline(srcStream, fs.createWriteStream(inputPath));
    console.log(`[${trackId}] Downloaded flac…`);
    postMessage({ type: MessageType.TrackStatus, releaseId, trackId, status: "transcoding", userId });
    postMessage({ type: MessageType.TranscodingStartedAAC, trackId, userId });

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
      await streamToBucket(BUCKET_MP4, `${bucketKey}/${file}`, mp4Stream);
    }

    // Save track and clean up.
    await Release.updateOne(filter, { "trackList.$.duration": metadata.format.duration }).exec();
    postMessage({ type: MessageType.TranscodingCompleteAAC, trackId, trackTitle, userId });
  } catch (error) {
    console.error(error);
    await Release.updateOne(filter, { "trackList.$.status": "error" }).exec();
    postMessage({ type: MessageType.TrackStatus, releaseId, trackId, status: "error", userId });
    postMessage({ type: MessageType.PipelineError, stage: "aac", trackId, userId });
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
