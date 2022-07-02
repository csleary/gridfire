import Release from "gridfire-worker/models/Release.js";
import User from "gridfire-worker/models/User.js";
import { decryptToFilePathByCid } from "gridfire-worker/controllers/ipfs.js";
import { encryptStream } from "gridfire-worker/controllers/encryption.js";
import { ffmpegEncodeFLAC } from "gridfire-worker/consumer/ffmpeg.js";
import fs from "fs";
import { ipfs } from "gridfire-worker/consumer/index.js";
import path from "path";
import postMessage from "gridfire-worker/consumer/postMessage.js";
import { publishToQueue } from "gridfire-worker/publisher/index.js";
import { randomUUID } from "crypto";

const { TEMP_PATH, QUEUE_TRANSCODE } = process.env;

const onProgress =
  ({ trackId, userId }) =>
  event => {
    const { percent } = event;
    postMessage({ type: "encodingProgressFLAC", progress: Math.round(percent), trackId, userId });
  };

const encodeFLAC = async ({ releaseId, trackId, trackName, userId }) => {
  let flacOutputPath, srcFilepath;

  try {
    const release = await Release.findOneAndUpdate(
      { _id: releaseId, "trackList._id": trackId },
      { "trackList.$.status": "encoding" },
      { fields: "trackList.$", lean: true }
    ).exec();

    const [{ src }] = release.trackList;
    const { key } = await User.findById(userId, "key", { lean: true }).exec();
    srcFilepath = await decryptToFilePathByCid(src, key);
    const tempFilename = randomUUID({ disableEntropyCache: true });
    flacOutputPath = path.resolve(TEMP_PATH, tempFilename);
    await ffmpegEncodeFLAC(srcFilepath, flacOutputPath, onProgress({ trackId, userId }));
    fs.accessSync(flacOutputPath, fs.constants.R_OK);
    const { size } = await fs.promises.stat(flacOutputPath);
    const flacFileStream = fs.createReadStream(flacOutputPath);
    const encryptedFlacStream = encryptStream(flacFileStream, key);

    const ipfsFLAC = await ipfs.add(encryptedFlacStream, {
      cidVersion: 1,
      progress: progressBytes => {
        const progress = Math.floor((progressBytes / size) * 100);
        postMessage({ type: "storingProgressFLAC", progress, trackId, userId });
      }
    });

    if (ipfsFLAC) {
      console.log(`[${trackId}] Unpinning source audio after successfully storing FLAC…`);
      await ipfs.pin.rm(src);
      console.log(`[${trackId}] Source audio succesfully unpinned from IPFS.`);
    }

    await Release.findOneAndUpdate(
      { _id: releaseId, "trackList._id": trackId },
      {
        "trackList.$.status": "encoded",
        "trackList.$.flac": ipfsFLAC.cid.toString(),
        $unset: { "trackList.$.src": 1 }
      }
    ).exec();

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
    console.log("Removing temp FLAC stage files:\n", srcFilepath, "\n", flacOutputPath);
    if (srcFilepath) await fs.promises.unlink(srcFilepath).catch(console.error);
    if (flacOutputPath) await fs.promises.unlink(flacOutputPath).catch(console.error);
  }
};

export default encodeFLAC;
