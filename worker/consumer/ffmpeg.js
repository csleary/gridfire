import ffmpeg from "fluent-ffmpeg";

const ffmpegEncodeFragmentedAAC = (inputFilepath, outputFilepath, onProgress) =>
  new Promise((resolve, reject) => {
    ffmpeg(inputFilepath)
      // .audioCodec('libfdk_aac')
      .audioCodec("aac")
      .audioBitrate(128)
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
      .save(outputFilepath);
  });

const ffmpegEncodeFLAC = async (inputFilepath, outputFilepath, onProgress) =>
  new Promise((resolve, reject) => {
    ffmpeg(inputFilepath)
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
      .save(outputFilepath);
  });

const ffmpegEncodeMP3FromStream = async (inputStream, outputStream, onProgress) =>
  new Promise((resolve, reject) => {
    ffmpeg(inputStream)
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
      .save(outputStream);
  });

const ffprobeGetTrackDuration = probeSrc =>
  new Promise((resolve, reject) =>
    ffmpeg.ffprobe(probeSrc, (error, metadata) => {
      if (error) return reject(`Probing error: ${error.message}`);
      resolve(metadata);
    })
  );

export { ffmpegEncodeFLAC, ffmpegEncodeFragmentedAAC, ffmpegEncodeMP3FromStream, ffprobeGetTrackDuration };
