import { Readable } from "stream";
import ffmpeg from "fluent-ffmpeg";
import fs from "fs";
import { ipfs } from "./index.js";
import path from "path";
import tar from "tar-stream";

const { TEMP_PATH } = process.env;

const encodeAacFrag = (downloadSrc, outputAudio, onProgress) =>
  new Promise((resolve, reject) => {
    ffmpeg(downloadSrc)
      // .audioCodec('libfdk_aac')
      .audioCodec("aac")
      .audioBitrate(128)
      .toFormat("mp4")
      .on("progress", onProgress)
      .output(outputAudio)
      .outputOptions(["-frag_duration 15000000", "-movflags default_base_moof+empty_moov"])
      .on("error", reject)
      .on("end", (error, stdout, stderr) => {
        console.log("AAC transcoding complete.");
        console.log(stdout);
        resolve();
      })
      .run();
  });

const encodeFlacStream = (srcStream, outputPath, onProgress) =>
  new Promise((resolve, reject) => {
    ffmpeg(srcStream)
      .audioCodec("flac")
      .audioChannels(2)
      .toFormat("flac")
      .on("progress", onProgress)
      .outputOptions("-compression_level 5")
      .on("end", (error, stdout, stderr) => {
        console.log("FLAC encoding complete.");
        console.log(stdout);
        resolve();
      })
      .on("error", reject)
      .save(outputPath);
  });

const encodeMp3 = async (release, onProgress) => {
  const { trackList } = release;

  for (const { _id: trackId, cids } of trackList) {
    const tarExtract = tar.extract();
    tarExtract.on("error", console.log);

    tarExtract.on("entry", async (header, srcStream, next) => {
      ffmpeg(srcStream)
        .audioCodec("libmp3lame")
        .toFormat("mp3")
        .on("progress", onProgress)
        .outputOptions("-q:a 0")
        .on("end", async (error, stdout, stderr) => {
          console.log("MP3 encoding complete.");
          next();
        })
        .on("error", console.log)
        .save(mp3Path);

      srcStream.resume();
    });

    tarExtract.on("finish", async () => {
      const mp3Stream = fs.createReadStream(mp3Path);
      const ipfsFile = await ipfs.add({ content: mp3Stream }, { progress: progress => console.log(progress) });
      const cidMP3 = ipfsFile.cid.toString();
      await fs.promises.unlink(mp3Path);
      const trackDoc = release.trackList.id(trackId);
      trackDoc.cids.mp3 = cidMP3;
      await release.save();
    });

    const cidFLAC = cids.flac;
    const tarStream = Readable.from(ipfs.get(cidFLAC));
    const mp3Path = path.resolve(TEMP_PATH, `${trackId}.mp3`);
    tarStream.pipe(tarExtract);
  }

  console.log("[Worker] Release converted to mp3.");
  return release;
};

const getTrackDuration = probeSrc =>
  new Promise((resolve, reject) =>
    ffmpeg.ffprobe(probeSrc, (error, metadata) => {
      if (error) {
        reject(`Probing error: ${error.message}`);
      }

      resolve(metadata);
    })
  );

export { encodeAacFrag, encodeFlacStream, encodeMp3, getTrackDuration };
