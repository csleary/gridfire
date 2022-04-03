import aws from "aws-sdk";
import ffmpeg from "fluent-ffmpeg";

const { BUCKET_MP3, BUCKET_SRC } = process.env;

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

const encodeMp3 = async (release, onProgress) =>
  new Promise(async (resolve, reject) => {
    const { _id: releaseId, trackList } = release;
    const s3 = new aws.S3();

    for (const track of trackList) {
      try {
        const { _id: trackId } = track;

        const { Contents, KeyCount } = await s3
          .listObjectsV2({ Bucket: BUCKET_SRC, Prefix: `${releaseId}/${trackId}` })
          .promise();

        if (!KeyCount) throw new Error("Track not found for encoding.");
        const [{ Key }] = Contents;
        const trackSrc = s3.getObject({ Bucket: BUCKET_SRC, Key }).createReadStream();

        const encode = ffmpeg(trackSrc)
          .audioCodec("libmp3lame")
          .toFormat("mp3")
          .on("progress", onProgress)
          .outputOptions("-q:a 0")
          .on("error", reject);

        const uploadParams = {
          Bucket: BUCKET_MP3,
          ContentType: "audio/mp3",
          Key: `${releaseId}/${trackId}.mp3`,
          Body: encode.pipe()
        };

        await s3.upload(uploadParams).promise();
      } catch (error) {
        reject(error);
      }
    }

    resolve();
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
