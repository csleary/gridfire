import Release from "../models/Release.js";
import aws from "aws-sdk";
import { encodeFlacStream } from "./ffmpeg.js";
import fs from "fs";
import path from "path";
import postMessage from "./postMessage.js";
import { publishToQueue } from "../publisher/index.js";

const { AWS_REGION, BUCKET_SRC, TEMP_PATH, WORKER_QUEUE } = process.env;
aws.config.update({ region: AWS_REGION });
const fsPromises = fs.promises;

const encodeFLAC = async ({ filePath, releaseId, trackId, trackName, userId }) => {
  let release;
  let trackDoc;

  try {
    postMessage({ message: "Encoding flac…", title: "Processing", userId });

    release = await Release.findOneAndUpdate(
      { _id: releaseId, "trackList._id": trackId },
      { $set: { "trackList.$.status": "encoding", "trackList.$.dateUpdated": Date.now() } },
      { new: true }
    ).exec();

    postMessage({ type: "updateTrackStatus", releaseId, trackId, status: "encoding", userId });
    const readFile = fs.createReadStream(filePath);
    const flacPath = path.resolve(TEMP_PATH, `${trackId}.flac`);

    const onProgress = ({ targetSize, timemark }) => {
      const [hours, mins, seconds] = timemark.split(":");
      const [s] = seconds.split(".");
      const h = hours !== "00" ? `${hours}:` : "";

      postMessage({
        message: `Encoded FLAC: ${h}${mins}:${s} (${targetSize}kB complete)`,
        trackId,
        type: "encodingProgressFLAC",
        userId
      });
    };

    await encodeFlacStream(readFile, flacPath, onProgress);
    const readFlac = fs.createReadStream(flacPath);
    const Key = `${releaseId}/${trackId}.flac`;
    const params = { Bucket: BUCKET_SRC, Key, Body: readFlac };
    const s3 = new aws.S3();

    await s3
      .upload(params)
      .on("httpUploadProgress", event => {
        const percent = Math.floor((event.loaded / event.total) * 100);

        postMessage({
          message: `Saving FLAC (${percent}% complete)`,
          trackId,
          type: "storingProgressFLAC",
          userId
        });
      })
      .promise();

    trackDoc = release.trackList.id(trackId);
    trackDoc.status = "encoded";
    trackDoc.dateUpdated = Date.now();
    await release.save();
    postMessage({ type: "updateTrackStatus", releaseId, trackId, status: "encoded", userId });
    postMessage({ type: "encodingCompleteFLAC", trackId, userId });

    publishToQueue("", WORKER_QUEUE, {
      job: "transcodeAAC",
      releaseId,
      trackId,
      trackName,
      userId
    });

    await fsPromises.unlink(filePath);
  } catch (error) {
    if (trackDoc) {
      trackDoc.status = "error";
      trackDoc.dateUpdated = Date.now();
      await release.save();
    }

    postMessage({ type: "updateTrackStatus", releaseId, trackId, status: "error", userId });
    await fsPromises.unlink(filePath).catch(() => {});
    throw error;
  }
};

export default encodeFLAC;
