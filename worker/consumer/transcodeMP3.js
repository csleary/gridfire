import { encryptStream, decryptStream } from "../../controllers/encryption.js";
import { Readable } from "stream";
import Release from "../models/Release.js";
import User from "../models/User.js";
import { ffmpegEncodeMP3 } from "./ffmpeg.js";
import fs from "fs";
import { ipfs } from "./index.js";
import path from "path";
import postMessage from "./postMessage.js";
import tar from "tar-stream";

const { TEMP_PATH } = process.env;

const transcodeMP3 = async ({ releaseId, trackId, userId }) => {
  try {
    postMessage({ type: "transcodingStartedMP3", trackId, userId });
    const { key } = await User.findById(userId, "key", { lean: true }).exec();
    const release = await Release.findOne({ _id: releaseId, "trackList._id": trackId, user: userId }, "trackList.$", {
      lean: true
    }).exec();

    const [{ cids }] = release.trackList;

    const cidMP3 = await new Promise((resolve, reject) => {
      const tarExtract = tar.extract();
      tarExtract.on("error", reject);

      tarExtract.on("entry", async (header, srcStream, next) => {
        try {
          const decryptedStream = await decryptStream(srcStream, key);
          await ffmpegEncodeMP3(decryptedStream, mp3Path);
          next();
        } catch (error) {
          srcStream.destroy(error);
          throw error;
        }
      });

      tarExtract.on("finish", async () => {
        try {
          const mp3Stream = fs.createReadStream(mp3Path);
          const encryptedFlacStream = encryptStream(mp3Stream, key);
          const ipfsFile = await ipfs.add(encryptedFlacStream);
          await fs.promises.unlink(mp3Path);
          resolve(ipfsFile.cid.toString());
        } catch (error) {
          throw error;
        }
      });

      const cidFLAC = cids.flac;
      const tarStream = Readable.from(ipfs.get(cidFLAC));
      const mp3Path = path.resolve(TEMP_PATH, `${trackId}.mp3`);
      tarStream.pipe(tarExtract);
    });

    await Release.findOneAndUpdate(
      { _id: releaseId, "trackList._id": trackId, user: userId },
      { "trackList.$.cids.mp3": cidMP3, "trackList.$.status": "stored" }
    ).exec();

    postMessage({ type: "transcodingCompleteMP3", trackId, userId });
    postMessage({ type: "updateTrackStatus", releaseId, trackId, status: "stored", userId });
    console.log(`[Worker] Track ${trackId} converted to MP3 and uploaded to IPFS.`);
  } catch (error) {
    console.log(error);
  }
};

export default transcodeMP3;
