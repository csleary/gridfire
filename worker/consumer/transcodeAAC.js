import { ffmpegEncodeFragmentedAAC, ffprobeGetTrackDuration } from "./ffmpeg.js";
import Release from "../models/Release.js";
import createMPD from "./createMPD.js";
import fs from "fs";
import { ipfs } from "./index.js";
import path from "path";
import postMessage from "./postMessage.js";
import sax from "sax";

const { TEMP_PATH } = process.env;
const fsPromises = fs.promises;

const onProgress =
  (trackId, userId) =>
  ({ targetSize, timemark }) => {
    const [hours, mins, seconds] = timemark.split(":");
    const [s] = seconds.split(".");
    const h = hours !== "00" ? `${hours}:` : "";

    postMessage({
      message: `Transcoded AAC: ${h}${mins}:${s} (${targetSize}kB complete)`,
      trackId,
      type: "transcodingProgressAAC",
      userId
    });
  };

const removeTempFiles = async ({ flacPath, mp4Path, playlistDir }) => {
  const dirContents = await fsPromises.readdir(playlistDir);
  const deleteFiles = dirContents.map(file => fsPromises.unlink(path.join(playlistDir, file)));
  const outcome = await Promise.allSettled([fsPromises.unlink(mp4Path), fsPromises.unlink(flacPath), ...deleteFiles]);
  if (outcome.some(({ status }) => status === "rejected")) return;
  await fsPromises.rmdir(playlistDir);
};

const transcodeAAC = async ({ releaseId, trackId, trackName, userId }) => {
  let flacPath, mp4Path, playlistDir;

  try {
    await Release.findOneAndUpdate(
      { _id: releaseId, "trackList._id": trackId, user: userId },
      { "trackList.$.status": "transcoding" }
    ).exec();

    postMessage({ message: "Transcoding to aac…", title: "Processing", userId });
    postMessage({ type: "updateTrackStatus", releaseId, trackId, status: "transcoding", userId });

    // Probe for track duration.
    flacPath = path.resolve(TEMP_PATH, `${trackId}.flac`);
    const probeSrc = fs.createReadStream(flacPath);
    const metadata = await ffprobeGetTrackDuration(probeSrc);

    // Transcode FLAC to AAC.
    mp4Path = path.resolve(TEMP_PATH, `${trackId}.mp4`);
    const flacStream = fs.createReadStream(flacPath);
    await ffmpegEncodeFragmentedAAC(flacStream, mp4Path, onProgress(trackId, userId));

    // Create mpd and playlists.
    playlistDir = path.resolve(TEMP_PATH, trackId);
    createMPD(mp4Path, trackId, playlistDir);
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
    const mp4Stream = fs.createReadStream(mp4Path);
    const ipfsMP4 = await ipfs.add(mp4Stream);

    // Add hls playlists to IPFS.
    const m3u8_master = await fsPromises.readFile(path.join(playlistDir, "master.m3u8"));
    const ipfs_m3u8_master = await ipfs.add(m3u8_master);
    const m3u8_track = await fsPromises.readFile(path.join(playlistDir, "audio-und-mp4a.m3u8"));
    const ipfs_m3u8_track = await ipfs.add(m3u8_track);

    // Save track and clean up.
    await Release.findOneAndUpdate(
      { _id: releaseId, "trackList._id": trackId, user: userId },
      {
        "trackList.$.cids.m3u8Master": ipfs_m3u8_master.cid.toString(),
        "trackList.$.cids.m3u8Track": ipfs_m3u8_track.cid.toString(),
        "trackList.$.cids.mp4": ipfsMP4.cid.toString(),
        "trackList.$.duration": metadata.format.duration,
        "trackList.$.initRange": initRange,
        "trackList.$.mpd": mpdData,
        "trackList.$.segmentDuration": segmentDuration,
        "trackList.$.segmentList": segmentList,
        "trackList.$.segmentTimescale": segmentTimescale,
        "trackList.$.status": "stored"
      }
    ).exec();

    postMessage({ type: "transcodingCompleteAAC", trackId, trackName, userId });
    postMessage({ type: "updateTrackStatus", releaseId, trackId, status: "stored", userId });
    await removeTempFiles({ flacPath, mp4Path, playlistDir });
  } catch (error) {
    await Release.findOneAndUpdate(
      { _id: releaseId, "trackList._id": trackId },
      { "trackList.$.status": "error" }
    ).exec();

    console.log(error);
    postMessage({ type: "updateTrackStatus", releaseId, trackId, status: "error", userId });
    await removeTempFiles({ flacPath, mp4Path, playlistDir });
    throw error;
  }
};

export default transcodeAAC;
