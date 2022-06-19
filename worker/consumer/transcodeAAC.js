import { ffmpegEncodeFragmentedAAC, ffprobeGetTrackDuration } from "gridfire-worker/consumer/ffmpeg.js";
import { randomBytes, randomUUID } from "crypto";
import Release from "gridfire-worker/models/Release.js";
import User from "gridfire-worker/models/User.js";
import createMPD from "gridfire-worker/consumer/createMPD.js";
import { decryptToFilePathByCid } from "gridfire-worker/controllers/ipfs.js";
import encryptMP4 from "gridfire-worker/consumer/encryptMP4.js";
import fs from "fs";
import { ipfs } from "gridfire-worker/consumer/index.js";
import path from "path";
import postMessage from "gridfire-worker/consumer/postMessage.js";
import sax from "sax";

const { TEMP_PATH } = process.env;
const fsPromises = fs.promises;

const removeTempFiles = async ({ flacFilepath, mp4Filepath, mp4EncFilepath, playlistDir }) => {
  const dirContents = await fsPromises.readdir(playlistDir);
  const deleteFiles = dirContents.map(file => fsPromises.unlink(path.join(playlistDir, file)));

  const outcome = await Promise.allSettled([
    fsPromises.unlink(flacFilepath),
    fsPromises.unlink(mp4Filepath),
    fsPromises.unlink(mp4EncFilepath),
    ...deleteFiles
  ]);

  if (outcome.some(({ status }) => status === "rejected")) return;
  await fsPromises.rmdir(playlistDir);
};

const transcodeAAC = async ({ releaseId, trackId, trackName, userId }) => {
  let flacFilepath, mp4Filepath, mp4EncFilepath, playlistDir;

  try {
    const release = await Release.findOneAndUpdate(
      { _id: releaseId, "trackList._id": trackId },
      { "trackList.$.status": "transcoding" },
      { fields: "trackList.$", lean: true }
    ).exec();

    const [{ cids }] = release.trackList;
    const cidFlac = cids.flac;
    const { key: decryptionKey } = await User.findById(userId, "key", { lean: true }).exec();
    flacFilepath = await decryptToFilePathByCid(cidFlac, decryptionKey);

    postMessage({ type: "trackStatus", releaseId, trackId, status: "transcoding", userId });
    postMessage({ type: "transcodingStartedAAC", trackId, userId });

    // Probe for track duration.
    const probeReadStream = fs.createReadStream(flacFilepath);
    const metadata = await ffprobeGetTrackDuration(probeReadStream);

    // Transcode to AAC.
    mp4Filepath = path.resolve(TEMP_PATH, randomUUID({ disableEntropyCache: true }));
    const flacReadStream = fs.createReadStream(flacFilepath);
    await ffmpegEncodeFragmentedAAC(flacReadStream, mp4Filepath);

    // Encrypt.
    mp4EncFilepath = path.resolve(TEMP_PATH, randomUUID({ disableEntropyCache: true }));
    const key = randomBytes(16).toString("hex");
    const kid = randomBytes(16).toString("hex");
    encryptMP4({ key, kid, mp4Filepath, mp4EncFilepath, trackId });

    // Create MPD.
    playlistDir = path.resolve(TEMP_PATH, trackId);
    createMPD(mp4EncFilepath, trackId, playlistDir);
    const outputMpd = path.resolve(playlistDir, `${trackId}.mpd`);
    const mpdData = await fsPromises.readFile(outputMpd);
    const strict = true;
    const parser = sax.parser(strict);
    const segmentList = [];
    let segmentDuration;
    let segmentTimescale;
    let initRange;

    parser.onopentag = node => {
      if (node.name === "SegmentList") {
        segmentDuration = node.attributes.duration;
        segmentTimescale = node.attributes.timescale;
      }

      if (node.name === "Initialization") {
        initRange = node.attributes.range;
      }
    };

    parser.onattribute = attr => {
      if (attr.name === "mediaRange") {
        segmentList.push(attr.value);
      }
    };

    parser.write(mpdData).close();

    // Add fragmented mp4 audio to IPFS.
    const mp4Stream = fs.createReadStream(mp4EncFilepath);
    const ipfsMP4 = await ipfs.add(mp4Stream, { cidVersion: 1 });

    // Save track and clean up.
    await Release.findOneAndUpdate(
      { _id: releaseId, "trackList._id": trackId, user: userId },
      {
        "trackList.$.cids.mp4": ipfsMP4.cid.toString(),
        "trackList.$.duration": metadata.format.duration,
        "trackList.$.initRange": initRange,
        "trackList.$.key": key,
        "trackList.$.kid": kid,
        "trackList.$.mpd": mpdData,
        "trackList.$.segmentDuration": segmentDuration,
        "trackList.$.segmentList": segmentList,
        "trackList.$.segmentTimescale": segmentTimescale
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
    await removeTempFiles({ flacFilepath, mp4Filepath, mp4EncFilepath, playlistDir }).catch(console.log);
  }
};

export default transcodeAAC;
