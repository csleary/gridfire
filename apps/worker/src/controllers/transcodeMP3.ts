import { ReleaseContext } from "@gridfire/shared/types/index";
import { MessageType } from "@gridfire/shared/types/messages";
import { ffmpegEncodeMP3FromStream } from "@gridfire/worker/controllers/ffmpeg";
import postMessage from "@gridfire/worker/controllers/postMessage";
import { streamFromBucket, streamToBucket } from "@gridfire/worker/controllers/storage";
import mongoose from "mongoose";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const { BUCKET_FLAC, BUCKET_MP3, TEMP_PATH } = process.env;
const Release = mongoose.model("Release");
const fsPromises = fs.promises;

assert(BUCKET_FLAC, "BUCKET_FLAC env var missing.");
assert(BUCKET_MP3, "BUCKET_MP3 env var missing.");
assert(TEMP_PATH, "TEMP_PATH env var missing.");

const transcodeMP3 = async ({ releaseId, trackId, userId }: ReleaseContext) => {
  const bucketKey = `${releaseId}/${trackId}`;
  const filter = { _id: releaseId, "trackList._id": trackId, user: userId };
  let mp3FilePath;

  try {
    postMessage({ type: MessageType.TranscodingStartedMP3, trackId, userId });
    const srcStream = await streamFromBucket(BUCKET_FLAC, bucketKey);
    const tempFilename = randomUUID({ disableEntropyCache: true });
    mp3FilePath = path.resolve(TEMP_PATH, tempFilename);
    await ffmpegEncodeMP3FromStream(srcStream, mp3FilePath);
    await streamToBucket(BUCKET_MP3, bucketKey, fs.createReadStream(mp3FilePath));
    await Release.updateOne(filter, { "trackList.$.status": "stored" }).exec();
    postMessage({ type: MessageType.TranscodingCompleteMP3, trackId, userId });
    postMessage({ type: MessageType.TrackStatus, releaseId, trackId, status: "stored", userId });
    console.log(`[Worker] Track ${trackId} converted to MP3 and uploaded to B2.`);
  } catch (error) {
    console.error(error);
    postMessage({ type: MessageType.PipelineError, stage: "mp3", trackId, userId });
  } finally {
    console.log("Removing temp MP3 stage file:", mp3FilePath);

    if (mp3FilePath) {
      await fsPromises.unlink(mp3FilePath);
    }
  }
};

export default transcodeMP3;
