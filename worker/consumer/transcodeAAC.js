import { encodeAacFrag, getTrackDuration } from "./ffmpeg.js";
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

const removeTempFiles = async (mp4Path, flacPath, playlistDir) => {
  const dirContents = await fsPromises.readdir(playlistDir);
  const deleteFiles = dirContents.map(file => fsPromises.unlink(path.join(playlistDir, file)));
  const outcome = await Promise.allSettled([fsPromises.unlink(mp4Path), fsPromises.unlink(flacPath), ...deleteFiles]);
  if (outcome.some(({ status }) => status === "rejected")) return;
  await fsPromises.rmdir(playlistDir);
};

const transcodeAAC = async ({ releaseId, trackId, trackName, userId }) => {
  let release, trackDoc, mp4Path, flacPath, playlistDir;

  try {
    release = await Release.findById(releaseId).exec();
    trackDoc = release.trackList.id(trackId);
    trackDoc.status = "transcoding";
    trackDoc.dateUpdated = Date.now();
    await release.save();
    postMessage({ message: "Transcoding to aac…", title: "Processing", userId });
    postMessage({ type: "updateTrackStatus", releaseId, trackId, status: "transcoding", userId });

    // Probe for track duration.
    flacPath = path.join(TEMP_PATH, `${trackId}.flac`);
    const probeSrc = fs.createReadStream(flacPath);
    const metadata = await getTrackDuration(probeSrc);
    trackDoc.duration = metadata.format.duration;
    trackDoc.dateUpdated = Date.now();
    await release.save();

    // Transcode FLAC to AAC.
    mp4Path = path.join(TEMP_PATH, `${trackId}.mp4`);
    const flacStream = fs.createReadStream(flacPath);

    await encodeAacFrag(flacStream, mp4Path, onProgress(trackId, userId));

    // Create mpd and playlists.
    playlistDir = path.join(TEMP_PATH, trackId);
    createMPD(mp4Path, trackId, playlistDir);
    const outputMpd = path.join(playlistDir, `${trackId}.mpd`);
    const mpdData = await fsPromises.readFile(outputMpd);
    const strict = true;
    const parser = sax.parser(strict);
    const segmentList = [];

    parser.onopentag = node => {
      if (node.name === "SegmentList") {
        trackDoc.segmentDuration = node.attributes.duration;
        trackDoc.segmentTimescale = node.attributes.timescale;
      }

      if (node.name === "Initialization") {
        trackDoc.initRange = node.attributes.range;
      }
    };

    parser.onattribute = attr => {
      if (attr.name === "mediaRange") {
        segmentList.push(attr.value);
      }
    };

    parser.write(mpdData).close();
    trackDoc.segmentList = segmentList;
    trackDoc.mpd = mpdData;
    await release.save();

    // Add fragmented mp4 audio to IPFS.
    const mp4Stream = fs.createReadStream(mp4Path);
    const ipfsMP4 = await ipfs.add({ content: mp4Stream }, { progress: console.log });
    trackDoc.cids.mp4 = ipfsMP4.cid.toString();

    // Add hls playlists to IPFS.
    const m3u8_master = await fsPromises.readFile(path.join(playlistDir, "master.m3u8"));
    const ipfs_m3u8_master = await ipfs.add(m3u8_master);
    trackDoc.cids.m3u8Master = ipfs_m3u8_master.cid.toString();
    const m3u8_track = await fsPromises.readFile(path.join(playlistDir, "audio-und-mp4a.m3u8"));
    const ipfs_m3u8_track = await ipfs.add(m3u8_track);
    trackDoc.cids.m3u8Track = ipfs_m3u8_track.cid.toString();

    // Save track and clean up.
    trackDoc.dateUpdated = Date.now();
    trackDoc.status = "stored";
    await release.save();
    postMessage({ type: "transcodingCompleteAAC", trackId, trackName, userId });
    postMessage({ type: "updateTrackStatus", releaseId, trackId, status: "stored", userId });
    await removeTempFiles(mp4Path, flacPath, playlistDir);
  } catch (error) {
    if (trackDoc) {
      trackDoc.status = "error";
      trackDoc.dateUpdated = Date.now();
      await release.save();
    }

    console.log(error);
    postMessage({ type: "updateTrackStatus", releaseId, trackId, status: "error", userId });
    await removeTempFiles(mp4Path, flacPath, playlistDir);
    throw error;
  }
};

export default transcodeAAC;
