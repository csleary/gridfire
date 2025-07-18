import Logger from "@gridfire/shared/logger";
import Release from "@gridfire/shared/models/Release";
import { MessageType } from "@gridfire/shared/types";
import { ReleaseContext } from "@gridfire/shared/types/index";
import { ffmpegEncodeFragmentedAAC, ffprobeGetTrackDuration } from "@gridfire/worker/controllers/ffmpeg";
import packageMP4 from "@gridfire/worker/controllers/packageMP4";
import postMessage from "@gridfire/worker/controllers/postMessage";
import { streamFromBucket, streamToBucket } from "@gridfire/worker/controllers/storage";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import fs, { promises as fsPromises } from "node:fs";
import path from "node:path";
import { pipeline } from "node:stream/promises";

const { BUCKET_FLAC, BUCKET_MP4, TEMP_PATH } = process.env;
assert(BUCKET_FLAC, "BUCKET_FLAC env var missing.");
assert(BUCKET_MP4, "BUCKET_MP4 env var missing.");
assert(TEMP_PATH, "TEMP_PATH env var missing.");
const logger = new Logger("transcodeAAC");

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
    logger.info(`[${trackId}] Downloaded flac…`);
    postMessage({ releaseId, status: "transcoding", trackId, type: MessageType.TrackStatus, userId });
    postMessage({ trackId, type: MessageType.TranscodingStartedAAC, userId });

    // Probe for track duration.
    fs.accessSync(inputPath, fs.constants.R_OK);
    const metadata = await ffprobeGetTrackDuration(inputPath);

    // Transcode to AAC MP4.
    logger.info(`[${trackId}] Transcoding flac to aac file: ${outputPath}…`);
    await ffmpegEncodeFragmentedAAC(fs.createReadStream(inputPath), outputPath);

    // Package MP4.
    fs.accessSync(outputPath, fs.constants.R_OK);
    await fsPromises.mkdir(path.resolve(TEMP_PATH, outputDir));
    logger.info(`[${trackId}] Packaging mp4 files in dir: ${outputDir}…`);
    await packageMP4(outputPath, outputDir);

    // Upload packaged mp4 files.
    const files = await fsPromises.readdir(path.resolve(TEMP_PATH, outputDir));

    for (const file of files) {
      const mp4Stream = fs.createReadStream(path.resolve(TEMP_PATH, outputDir, file));
      await streamToBucket(BUCKET_MP4, `${bucketKey}/${file}`, mp4Stream);
    }

    // Save track and clean up.
    await Release.updateOne(filter, { "trackList.$.duration": metadata.format.duration }).exec();
    postMessage({ trackId, trackTitle, type: MessageType.TranscodingCompleteAAC, userId });
  } catch (error) {
    logger.error(error);
    await Release.updateOne(filter, { "trackList.$.status": "error" }).exec();
    postMessage({ releaseId, status: "error", trackId, type: MessageType.TrackStatus, userId });
    postMessage({ stage: "aac", trackId, type: MessageType.PipelineError, userId });
    throw error;
  } finally {
    logger.info("Removing temp AAC stage files:\n", inputPath, "\n", outputPath);

    await Promise.allSettled([
      fsPromises.unlink(inputPath),
      fsPromises.unlink(outputPath),
      fsPromises.rm(path.resolve(TEMP_PATH, outputDir), { recursive: true })
    ]);
  }
};

export default transcodeAAC;
