import { encryptStream, decryptStream } from "gridfire-worker/controllers/encryption.js";
import { Readable } from "stream";
import Release from "gridfire-worker/models/Release.js";
import User from "gridfire-worker/models/User.js";
import { ffmpegEncodeFLAC } from "gridfire-worker/consumer/ffmpeg.js";
import fs from "fs";
import { ipfs } from "gridfire-worker/consumer/index.js";
import path from "path";
import postMessage from "gridfire-worker/consumer/postMessage.js";
import { publishToQueue } from "gridfire-worker/publisher/index.js";
import tar from "tar-stream";

const { TEMP_PATH, QUEUE_TRANSCODE } = process.env;

const onProgress =
  ({ trackId, userId }) =>
  event => {
    const { percent } = event;
    postMessage({ type: "encodingProgressFLAC", progress: Math.round(percent), trackId, userId });
  };

const encodeFLAC = async ({ cid, releaseId, trackId, trackName, userId }) => {
  try {
    await Release.findOneAndUpdate(
      { _id: releaseId, "trackList._id": trackId },
      { "trackList.$.status": "encoding" }
    ).exec();

    const { key } = await User.findById(userId, "key", { lean: true }).exec();
    const flacPath = path.resolve(TEMP_PATH, `${trackId}.flac`);
    const tarStream = Readable.from(ipfs.get(cid));
    const tarExtract = tar.extract();

    await new Promise((resolve, reject) => {
      tarExtract.on("entry", async (header, srcStream, next) => {
        const handleStreamError =
          (...streams) =>
          error => {
            console.log(error);
            for (const stream of streams) stream.destory();
            throw error;
          };

        try {
          const decryptedStream = await decryptStream(srcStream, key);
          srcStream.on("error", handleStreamError(srcStream, decryptedStream));
          decryptedStream.on("error", handleStreamError(srcStream, decryptedStream));
          await ffmpegEncodeFLAC(decryptedStream, flacPath, onProgress({ trackId, userId }));
          next();
        } catch (error) {
          srcStream.destroy(error);
          throw error;
        }
      });

      tarExtract.on("finish", resolve);
      tarExtract.on("error", reject);
      tarStream.pipe(tarExtract);
    });

    const { size } = await fs.promises.stat(flacPath);
    const flacFileStream = fs.createReadStream(flacPath);
    const encryptedFlacStream = encryptStream(flacFileStream, key);

    const ipfsFLAC = await ipfs.add(encryptedFlacStream, {
      cidVersion: 1,
      progress: progressBytes => {
        const progress = Math.floor((progressBytes / size) * 100);
        postMessage({ type: "storingProgressFLAC", progress, trackId, userId });
      }
    });

    await Release.findOneAndUpdate(
      { _id: releaseId, "trackList._id": trackId },
      { "trackList.$.status": "encoded", "trackList.$.cids.flac": ipfsFLAC.cid.toString() }
    ).exec();

    publishToQueue("", QUEUE_TRANSCODE, { job: "transcodeAAC", releaseId, trackId, trackName, userId });
    publishToQueue("", QUEUE_TRANSCODE, { job: "transcodeMP3", releaseId, trackId, userId });
  } catch (error) {
    console.log(error);

    await Release.findOneAndUpdate(
      { _id: releaseId, "trackList._id": trackId },
      { "trackList.$.status": "error", "trackList.$.dateUpdated": Date.now() }
    ).exec();

    postMessage({ type: "trackStatus", releaseId, trackId, status: "error", userId });
    postMessage({ type: "pipelineError", stage: "flac", trackId, userId });
    throw error;
  }
};

export default encodeFLAC;
