import { streamFromBucket, streamToBucket } from "gridfire-worker/controllers/storage.js";
import { ReleaseContext } from "gridfire-worker/types/index.js";
import assert from "assert/strict";
import { ffmpegEncodeMP3FromStream } from "gridfire-worker/consumer/ffmpeg.js";
import fs from "fs";
import mongoose from "mongoose";
import path from "path";
import postMessage from "gridfire-worker/consumer/postMessage.js";
import { randomUUID } from "crypto";

const { BUCKET_FLAC, BUCKET_MP3, TEMP_PATH } = process.env;
const Release = mongoose.model("Release");
const fsPromises = fs.promises;

assert(BUCKET_FLAC, "BUCKET_FLAC env var missing.");
assert(BUCKET_MP3, "BUCKET_MP3 env var missing.");
assert(TEMP_PATH, "TEMP_PATH env var missing.");

const transcodeMP3 = async ({ releaseId, trackId, userId }: ReleaseContext) => {
  let mp3FilePath;

  try {
    postMessage({ type: "transcodingStartedMP3", trackId, userId });
    const srcStream = await streamFromBucket(BUCKET_FLAC, `${releaseId}/${trackId}`);
    const tempFilename = randomUUID({ disableEntropyCache: true });
    mp3FilePath = path.resolve(TEMP_PATH, tempFilename);
    await ffmpegEncodeMP3FromStream(srcStream, mp3FilePath);
    await streamToBucket(BUCKET_MP3, `${releaseId}/${trackId}`, fs.createReadStream(mp3FilePath));

    await Release.findOneAndUpdate(
      { _id: releaseId, "trackList._id": trackId, user: userId },
      { "trackList.$.status": "stored" }
    ).exec();

    postMessage({ type: "transcodingCompleteMP3", trackId, userId });
    postMessage({ type: "trackStatus", releaseId, trackId, status: "stored", userId });
    console.log(`[Worker] Track ${trackId} converted to MP3 and uploaded to B2.`);
  } catch (error) {
    console.error(error);
    postMessage({ type: "pipelineError", stage: "mp3", trackId, userId });
  } finally {
    console.log("Removing temp MP3 stage file:", mp3FilePath);

    if (mp3FilePath) {
      await fsPromises.unlink(mp3FilePath);
    }
  }
};

export default transcodeMP3;
