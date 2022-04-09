import { Readable } from "stream";
import Release from "../models/Release.js";
import { encodeMp3 } from "./ffmpeg.js";
import fs from "fs";
import { ipfs } from "./index.js";
import path from "path";
import postMessage from "./postMessage.js";
import tar from "tar-stream";

const { TEMP_PATH } = process.env;

const onProgress =
  userId =>
  ({ targetSize, timemark }) => {
    const [hours, mins, seconds] = timemark.split(":");
    const [s] = seconds.split(".");
    const h = hours !== "00" ? `${hours}:` : "";
    postMessage({ message: `Transcoding MP3: ${h}${mins}:${s} (${targetSize}kB complete)`, userId });
  };

const transcodeMP3 = async ({ releaseId, trackId, userId }) => {
  try {
    const release = await Release.findById(releaseId).exec();
    const trackDoc = release.trackList.id(trackId);
    const { cids } = trackDoc;

    await new Promise((resolve, reject) => {
      const tarExtract = tar.extract();
      tarExtract.on("error", reject);

      tarExtract.on("entry", async (header, srcStream, next) => {
        try {
          console.log(header);
          srcStream.read();
          await encodeMp3(srcStream, mp3Path, onProgress(userId));
          next();
        } catch (error) {
          throw error;
        }
      });

      tarExtract.on("finish", async () => {
        try {
          const mp3Stream = fs.createReadStream(mp3Path);
          const ipfsFile = await ipfs.add({ content: mp3Stream }, { progress: console.log });
          const cidMP3 = ipfsFile.cid.toString();
          await fs.promises.unlink(mp3Path);
          trackDoc.cids.mp3 = cidMP3;
          trackDoc.dateUpdated = Date.now();
          await release.save();
          resolve();
        } catch (error) {
          throw error;
        }
      });

      const cidFLAC = cids.flac;
      const tarStream = Readable.from(ipfs.get(cidFLAC));
      const mp3Path = path.resolve(TEMP_PATH, `${trackId}.mp3`);
      tarStream.pipe(tarExtract);
    });

    console.log("[Worker] Track converted to MP3 and uploaded to IPFS.");
    postMessage({ type: "transcodingCompleteMP3", format: "mp3", releaseId, userId });
  } catch (error) {
    console.log(error);
  }
};

export default transcodeMP3;
