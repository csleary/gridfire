import ffmpeg from "fluent-ffmpeg";

const encodeAacFrag = (srcStream, outputPath, onProgress) =>
  new Promise((resolve, reject) => {
    ffmpeg(srcStream)
      // .audioCodec('libfdk_aac')
      .audioCodec("aac")
      .audioBitrate(128)
      .toFormat("mp4")
      .on("progress", onProgress)
      .output(outputPath)
      .outputOptions(["-frag_duration 15000000", "-movflags default_base_moof+empty_moov"])
      .on("error", reject)
      .on("end", (error, stdout, stderr) => {
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
        console.log(stdout);
        resolve();
      })
      .on("error", reject)
      .save(outputPath);
  });

const encodeMp3 = async (srcStream, outputPath, onProgress) =>
  new Promise((resolve, reject) => {
    ffmpeg(srcStream)
      .audioCodec("libmp3lame")
      .toFormat("mp3")
      .on("progress", onProgress)
      .outputOptions("-q:a 0")
      .on("end", async (error, stdout, stderr) => {
        console.log(stdout);
        resolve();
      })
      .on("error", reject)
      .save(outputPath);
  });

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
