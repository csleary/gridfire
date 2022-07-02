import { ffmpegEncodeFragmentedAAC, ffprobeGetTrackDuration } from "gridfire-worker/consumer/ffmpeg.js";
import { randomUUID } from "crypto";
import Release from "gridfire-worker/models/Release.js";
import User from "gridfire-worker/models/User.js";
import { decryptToFilePathByCid } from "gridfire-worker/controllers/ipfs.js";
import encryptMP4 from "gridfire-worker/consumer/encryptMP4.js";
import fs from "fs";
import { ipfs } from "gridfire-worker/consumer/index.js";
import path from "path";
import postMessage from "gridfire-worker/consumer/postMessage.js";
import { strict as assert } from "assert/strict";

const { TEMP_PATH } = process.env;
assert(TEMP_PATH, "TEMP_PATH is not set.");
const fsPromises = fs.promises;

const transcodeAAC = async ({ releaseId, trackId, trackName, userId }) => {
  let flacPath, inputPath, outputFilename;

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

    // Transcode to AAC.
    inputPath = path.resolve(TEMP_PATH, randomUUID({ disableEntropyCache: true }));
    console.log(`[${trackId}] Transcoding flac to mp4 file: ${inputPath}…`);
    const flacReadStream = fs.createReadStream(flacPath);
    await ffmpegEncodeFragmentedAAC(flacReadStream, inputPath);

    // Encrypt MP4.
    fs.accessSync(inputPath, fs.constants.R_OK);
    outputFilename = randomUUID({ disableEntropyCache: true });
    console.log(`[${trackId}] Encrypting mp4 file: ${outputFilename}…`);
    const { key, kid } = encryptMP4(inputPath, outputFilename);
    const mp4Stream = fs.createReadStream(path.resolve(TEMP_PATH, outputFilename));
    const mp4Ipfs = await ipfs.add(mp4Stream, { cidVersion: 1 });
    const mp4 = mp4Ipfs.cid.toString();

    // Create MPD.
    const mpdOutput = path.resolve(TEMP_PATH, "dash.mpd");
    const mpdData = await fsPromises.readFile(mpdOutput, "utf8");
    const mpdUpdate = mpdData.replaceAll(outputFilename, mp4);
    const mpdIpfs = await ipfs.add(mpdUpdate, { cidVersion: 1 });
    const mpd = mpdIpfs.cid.toString();

    // Create HLS track playlist.
    const hlsOutput = path.resolve(TEMP_PATH, "hls.m3u8");
    const hlsData = await fsPromises.readFile(hlsOutput, "utf8");
    const hlsUpdate = hlsData.replaceAll(outputFilename, mp4);
    const hlsIpfs = await ipfs.add(hlsUpdate, { cidVersion: 1 });
    const hls = hlsIpfs.cid.toString();

    // Create HLS master playlist.
    const mstOutput = path.resolve(TEMP_PATH, "master.m3u8");
    const mstData = await fsPromises.readFile(mstOutput, "utf8");
    const mstUpdate = mstData.replaceAll("hls.m3u8", hls);
    const mstIpfs = await ipfs.add(mstUpdate, { cidVersion: 1 });
    const mst = mstIpfs.cid.toString();

    // Save track and clean up.
    await Release.findOneAndUpdate(
      { _id: releaseId, "trackList._id": trackId, user: userId },
      {
        "trackList.$.duration": metadata.format.duration,
        "trackList.$.key": key,
        "trackList.$.kid": kid,
        "trackList.$.hls": hls,
        "trackList.$.mst": mst,
        "trackList.$.mp4": mp4,
        "trackList.$.mpd": mpd
      }
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
      fsPromises.unlink(path.resolve(TEMP_PATH, outputFilename)),
      fsPromises.unlink(path.resolve(TEMP_PATH, "dash.mpd")),
      fsPromises.unlink(path.resolve(TEMP_PATH, "hls.m3u8")),
      fsPromises.unlink(path.resolve(TEMP_PATH, "master.m3u8"))
    ]);
  }
};

export default transcodeAAC;
