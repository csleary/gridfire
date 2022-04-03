import { Readable } from "stream";
import Release from "../models/Release.js";
import { encodeFlacStream } from "./ffmpeg.js";
import fs from "fs";
import { ipfs } from "./index.js";
import path from "path";
import postMessage from "./postMessage.js";
import { publishToQueue } from "../publisher/index.js";
import tar from "tar-stream";

const { TEMP_PATH, WORKER_QUEUE } = process.env;

const encodeFLAC = async ({ cid, releaseId, trackId, trackName, userId }) => {
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
    const flacPath = path.resolve(TEMP_PATH, `${trackId}.flac`);
    const tarStream = Readable.from(ipfs.get(cid));
    const tarExtract = tar.extract();

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

    let size;
    await new Promise((resolve, reject) => {
      tarExtract.on("entry", async (header, stream, next) => {
        console.log(header);
        size = header.size;
        stream.on("end", next);
        stream.resume();
        await encodeFlacStream(stream, flacPath, onProgress);
      });

      tarExtract.on("finish", resolve);
      tarExtract.on("error", reject);
      tarStream.pipe(tarExtract);
    });

    const flacStream = fs.createReadStream(flacPath);
    const ipfsFLAC = await ipfs.add(
      { content: flacStream },
      {
        progress: progress => {
          const percent = Math.floor((progress / size) * 100);
          console.log({ percent });

          postMessage({
            message: `Saving FLAC (${percent}% complete)`,
            trackId,
            type: "storingProgressFLAC",
            userId
          });
        }
      }
    );

    trackDoc = release.trackList.id(trackId);
    trackDoc.status = "encoded";
    trackDoc.cids.flac = ipfsFLAC.cid.toString();
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
  } catch (error) {
    if (trackDoc) {
      trackDoc.status = "error";
      trackDoc.dateUpdated = Date.now();
      await release.save();
    }

    postMessage({ type: "updateTrackStatus", releaseId, trackId, status: "error", userId });
    throw error;
  }
};

export default encodeFLAC;
