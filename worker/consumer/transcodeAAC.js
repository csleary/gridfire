import { ffmpegEncodeFragmentedAAC, ffprobeGetTrackDuration } from "gridfire-worker/consumer/ffmpeg.js";
import Release from "gridfire-worker/models/Release.js";
import User from "gridfire-worker/models/User.js";
import { decryptToFilePathByCid } from "gridfire-worker/controllers/ipfs.js";
import packageMP4 from "gridfire-worker/consumer/packageMP4.js";
import fs from "fs";
import { ipfs } from "gridfire-worker/consumer/index.js";
import path from "path";
import postMessage from "gridfire-worker/consumer/postMessage.js";
import { randomUUID } from "crypto";
import { strict as assert } from "assert/strict";

const { TEMP_PATH } = process.env;
assert(TEMP_PATH, "TEMP_PATH is not set.");
const fsPromises = fs.promises;

const transcodeAAC = async ({ releaseId, trackId, trackName, userId }) => {
  let flacPath, inputPath, outputDirName;

  try {
    const release = await Release.findOneAndUpdate(
      { _id: releaseId, "trackList._id": trackId },
      { "trackList.$.status": "transcoding" },
      { fields: "trackList.$", lean: true }
    ).exec();

    const [{ flac }] = release.trackList;
    const { key: decryptionKey } = await User.findById(userId, "key", { lean: true }).exec();
    flacPath = await decryptToFilePathByCid(flac, decryptionKey);
    console.log(`[${trackId}] Downloaded flac…`);
    postMessage({ type: "trackStatus", releaseId, trackId, status: "transcoding", userId });
    postMessage({ type: "transcodingStartedAAC", trackId, userId });

    // Probe for track duration.
    fs.accessSync(flacPath, fs.constants.R_OK);
    const probeReadStream = fs.createReadStream(flacPath);
    const metadata = await ffprobeGetTrackDuration(probeReadStream);

    // Transcode to AAC MP4.
    inputPath = path.resolve(TEMP_PATH, randomUUID({ disableEntropyCache: true }));
    console.log(`[${trackId}] Transcoding flac to mp4 file: ${inputPath}…`);
    const flacReadStream = fs.createReadStream(flacPath);
    await ffmpegEncodeFragmentedAAC(flacReadStream, inputPath);

    // Package MP4.
    fs.accessSync(inputPath, fs.constants.R_OK);
    outputDirName = randomUUID({ disableEntropyCache: true });
    await fsPromises.mkdir(path.resolve(TEMP_PATH, outputDirName));
    console.log(`[${trackId}] Packaging mp4 files in dir: ${outputDirName}…`);
    await packageMP4(inputPath, outputDirName);

    // Upload to IPFS and save directory CID.
    const files = await fsPromises.readdir(path.resolve(TEMP_PATH, outputDirName));
    await ipfs.files.mkdir(`/${releaseId}/${trackId}`, { parents: true });

    for (const file of files) {
      const mp4Stream = fs.createReadStream(path.resolve(TEMP_PATH, outputDirName, file));

      await ipfs.files.write(`/${releaseId}/${trackId}/${file}`, mp4Stream, {
        cidVersion: 1,
        create: true
      });
    }

    const mp4Ipfs = await ipfs.files.stat(`/${releaseId}/${trackId}`);
    const cid = mp4Ipfs.cid.toV1().toString();

    // Save track and clean up.
    await Release.findOneAndUpdate(
      { _id: releaseId, "trackList._id": trackId, user: userId },
      { "trackList.$.duration": metadata.format.duration, "trackList.$.mp4": cid }
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
    console.log("Removing temp AAC stage files…");

    await Promise.allSettled([
      fsPromises.unlink(flacPath),
      fsPromises.unlink(inputPath),
      fsPromises.rm(path.resolve(TEMP_PATH, outputDirName), { recursive: true })
    ]);
  }
};

export default transcodeAAC;
