const aws = require('aws-sdk');
const { BUCKET_MP3, BUCKET_SRC } = require('../config/constants');
const ffmpeg = require('fluent-ffmpeg');

const encodeAacFrag = (downloadSrc, outputAudio) =>
  new Promise((resolve, reject) => {
    ffmpeg(downloadSrc)
      // .audioCodec('libfdk_aac')
      .audioCodec('aac')
      .audioBitrate(128)
      .toFormat('mp4')
      .on('stderr', () => {})
      .output(outputAudio)
      .outputOptions([
        '-frag_duration 15000000',
        '-movflags default_base_moof+empty_moov'
      ])
      .on('error', error => reject(`Transcoding error: ${error.toString()}`))
      .on('end', resolve)
      .run();
  });

const encodeFlacStream = (stream, outputPath) =>
  new Promise((resolve, reject) => {
    ffmpeg(stream)
      .audioCodec('flac')
      .audioChannels(2)
      .toFormat('flac')
      .outputOptions('-compression_level 5')
      .on('end', resolve)
      .on('error', error => reject(error.toString()))
      .save(outputPath);
  });

const encodeMp3 = async release => {
  try {
    const s3 = new aws.S3();
    const { trackList } = release;
    const releaseId = release._id.toString();

    const data = await s3
      .listObjectsV2({
        Bucket: BUCKET_SRC,
        Prefix: releaseId
      })
      .promise();

    for (const s3Track of data.Contents) {
      const { Key } = s3Track;
      const trackId = trackList.find(track => Key.includes(track._id))._id;

      const trackSrc = s3
        .getObject({ Bucket: BUCKET_SRC, Key })
        .createReadStream();

      const encode = ffmpeg(trackSrc)
        .audioCodec('libmp3lame')
        .toFormat('mp3')
        .outputOptions('-q:a 0')
        .on('error', encodingError => {
          throw `Transcoding error: ${encodingError.message}`;
        });

      const uploadParams = {
        Bucket: BUCKET_MP3,
        ContentType: 'audio/mp3',
        Key: `${releaseId}/${trackId}.mp3`,
        Body: encode.pipe()
      };

      await s3.upload(uploadParams).promise();
    }
  } catch (error) {
    throw new Error(error);
  }
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

module.exports = {
  encodeAacFrag,
  encodeFlacStream,
  encodeMp3,
  getTrackDuration
};
