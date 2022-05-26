import ffmpeg from "fluent-ffmpeg";
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";

const { TEMP_PATH } = process.env;

const ffmpegEncodeFragmentedAAC = (srcStream, outputPath, onProgress) =>
  new Promise((resolve, reject) => {
    ffmpeg(srcStream)
      // .audioCodec('libfdk_aac')
      .audioCodec("aac")
      .audioBitrate(96)
      .toFormat("mp4")
      .outputOptions(["-frag_duration 15000000", "-movflags default_base_moof+empty_moov"])
      // .on("codecData", console.log)
      .on("end", (stdout, stderr) => {
        // console.log(stderr);
        resolve();
      })
      .on("error", reject)
      // .on("progress", onProgress)
      .on("start", console.log)
      .save(outputPath);
  });

const ffmpegEncodeFLAC = async (srcStream, outputPath, onProgress) => {
  const tempFilename = randomUUID({ disableEntropyCache: true });
  const tempPath = path.resolve(TEMP_PATH, tempFilename);
  const streamToDisk = fs.createWriteStream(tempPath); // Buffer to disk first so FFMPEG can calculate the duration properly.
  streamToDisk.on("error", console.log);
  const streamFromIPFS = new Promise(resolve => void streamToDisk.on("finish", resolve));
  srcStream.pipe(streamToDisk);
  await streamFromIPFS;

  await new Promise((resolve, reject) => {
    ffmpeg(tempPath)
      .audioCodec("flac")
      .audioChannels(2)
      .toFormat("flac")
      // .on("codecData", console.log)
      .on("end", (stdout, stderr) => {
        // console.log(stderr);
        resolve();
      })
      .on("error", reject)
      .on("progress", onProgress)
      .on("start", console.log)
      .outputOptions("-compression_level 5")
      .save(outputPath);
  });

  await fs.promises.unlink(tempPath);
};

const ffmpegEncodeMP3 = async (srcStream, outputPath, onProgress) =>
  new Promise((resolve, reject) => {
    ffmpeg(srcStream)
      .audioCodec("libmp3lame")
      .toFormat("mp3")
      .outputOptions("-q:a 0")
      // .on("codecData", console.log)
      .on("end", async (stdout, stderr) => {
        // console.log(stderr);
        resolve();
      })
      .on("error", reject)
      // .on("progress", onProgress)
      .on("start", console.log)
      .save(outputPath);
  });

const ffprobeGetTrackDuration = probeSrc =>
  new Promise((resolve, reject) =>
    ffmpeg.ffprobe(probeSrc, (error, metadata) => {
      if (error) return reject(`Probing error: ${error.message}`);
      resolve(metadata);
    })
  );

export { ffmpegEncodeFLAC, ffmpegEncodeFragmentedAAC, ffmpegEncodeMP3, ffprobeGetTrackDuration };
