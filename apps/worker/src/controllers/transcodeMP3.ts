import Logger from "@gridfire/shared/logger";
import Release from "@gridfire/shared/models/Release";
import { MessageType } from "@gridfire/shared/types";
import { ReleaseContext } from "@gridfire/shared/types/index";
import { ffmpegEncodeMP3FromStream } from "@gridfire/worker/controllers/ffmpeg";
import postMessage from "@gridfire/worker/controllers/postMessage";
import { streamFromBucket, streamToBucket } from "@gridfire/worker/controllers/storage";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import fs, { promises as fsPromises } from "node:fs";
import path from "node:path";

const { BUCKET_FLAC, BUCKET_MP3, TEMP_PATH } = process.env;
assert(BUCKET_FLAC, "BUCKET_FLAC env var missing.");
assert(BUCKET_MP3, "BUCKET_MP3 env var missing.");
assert(TEMP_PATH, "TEMP_PATH env var missing.");
const logger = new Logger("transcodeMP3");

const transcodeMP3 = async ({ releaseId, trackId, userId }: ReleaseContext) => {
  const bucketKey = `${releaseId}/${trackId}`;
  const filter = { _id: releaseId, "trackList._id": trackId, user: userId };
  let mp3FilePath;

  try {
    postMessage({ trackId, type: MessageType.TranscodingStartedMP3, userId });
    const srcStream = await streamFromBucket(BUCKET_FLAC, bucketKey);
    const tempFilename = randomUUID({ disableEntropyCache: true });
    mp3FilePath = path.resolve(TEMP_PATH, tempFilename);
    await ffmpegEncodeMP3FromStream(srcStream, mp3FilePath);
    await streamToBucket(BUCKET_MP3, bucketKey, fs.createReadStream(mp3FilePath));
    await Release.updateOne(filter, { "trackList.$.status": "stored" }).exec();
    postMessage({ trackId, type: MessageType.TranscodingCompleteMP3, userId });
    postMessage({ releaseId, status: "stored", trackId, type: MessageType.TrackStatus, userId });
    logger.info(`[Worker] Track ${trackId} converted to MP3 and uploaded to B2.`);
  } catch (error) {
    logger.error(error);
    postMessage({ stage: "mp3", trackId, type: MessageType.PipelineError, userId });
  } finally {
    logger.info("Removing temp MP3 stage file:", mp3FilePath);

    if (mp3FilePath) {
      await fsPromises.unlink(mp3FilePath);
    }
  }
};

export default transcodeMP3;
