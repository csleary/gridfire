import Release from "gridfire-worker/models/Release.js";
import User from "gridfire-worker/models/User.js";
import { ffmpegEncodeMP3FromStream } from "gridfire-worker/consumer/ffmpeg.js";
import postMessage from "gridfire-worker/consumer/postMessage.js";
import { transformIpfsStreamByCid } from "gridfire-worker/controllers/ipfs.js";

const transcodeMP3 = async ({ releaseId, trackId, userId }) => {
  try {
    postMessage({ type: "transcodingStartedMP3", trackId, userId });
    const { key } = await User.findById(userId, "key", { lean: true }).exec();

    const release = await Release.findOne({ _id: releaseId, "trackList._id": trackId, user: userId }, "trackList.$", {
      lean: true
    }).exec();

    const [{ cids }] = release.trackList;
    const cid = cids.flac;
    const cidMP3 = await transformIpfsStreamByCid(cid, key, ffmpegEncodeMP3FromStream);

    await Release.findOneAndUpdate(
      { _id: releaseId, "trackList._id": trackId, user: userId },
      { "trackList.$.cids.mp3": cidMP3, "trackList.$.status": "stored" }
    ).exec();

    postMessage({ type: "transcodingCompleteMP3", trackId, userId });
    postMessage({ type: "trackStatus", releaseId, trackId, status: "stored", userId });
    console.log(`[Worker] Track ${trackId} converted to MP3 and uploaded to IPFS.`);
  } catch (error) {
    console.error(error);
    postMessage({ type: "pipelineError", stage: "mp3", trackId, userId });
  }
};

export default transcodeMP3;
