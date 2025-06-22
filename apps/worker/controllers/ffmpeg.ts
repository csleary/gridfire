import ffmpeg from "fluent-ffmpeg";
import { Readable } from "node:stream";

interface Progress {
  percent: number;
  loaded: number;
  total: number;
}

type ProgressListener = (progress: Progress) => void;

const ffmpegEncodeFragmentedAAC = (inputStream: Readable, outputFilepath: string, onProgress?: ProgressListener) =>
  new Promise((resolve, reject) => {
    ffmpeg(inputStream)
      .noVideo()
      .audioChannels(2)
      .audioCodec("aac")
      .audioBitrate(128)
      .toFormat("mp4")
      // .on("codecData", console.log)
      .on("end", (stdout, stderr) => {
        // console.log(stderr);
        resolve(void 0);
      })
      .on("error", reject)
      // .on("progress", onProgress)
      .on("start", console.log)
      .save(outputFilepath);
  });

const ffmpegEncodeFLAC = async (inputFilepath: string, outputFilepath: string, onProgress: ProgressListener) =>
  new Promise((resolve, reject) => {
    ffmpeg(inputFilepath)
      .noVideo() // Strip-out non-audio streams.
      .audioCodec("flac")
      .audioChannels(2)
      .toFormat("flac")
      // .on("codecData", console.log)
      .on("end", (stdout, stderr) => {
        // console.log(stderr);
        resolve(void 0);
      })
      .on("error", reject)
      .on("progress", onProgress as any)
      .on("start", console.log)
      .outputOptions("-compression_level 5")
      .save(outputFilepath);
  });

const ffmpegEncodeMP3FromStream = async (
  inputStream: Readable,
  outputFilepath: string,
  onProgress?: ProgressListener
) =>
  new Promise((resolve, reject) => {
    ffmpeg(inputStream)
      .noVideo()
      .audioCodec("libmp3lame")
      .audioChannels(2)
      .toFormat("mp3")
      .outputOptions("-q:a 0")
      // .on("codecData", console.log)
      .on("end", async (stdout, stderr) => {
        // console.log(stderr);
        resolve(void 0);
      })
      .on("error", reject)
      // .on("progress", onProgress)
      .on("start", console.log)
      .save(outputFilepath);
  });

const ffprobeGetTrackDuration = (probeSrc: string): Promise<ffmpeg.FfprobeData> =>
  new Promise((resolve, reject) =>
    ffmpeg.ffprobe(probeSrc, (error, metadata) => {
      if (error) return reject(`Probing error: ${error.message}`);
      resolve(metadata);
    })
  );

export { ffmpegEncodeFLAC, ffmpegEncodeFragmentedAAC, ffmpegEncodeMP3FromStream, ffprobeGetTrackDuration };
