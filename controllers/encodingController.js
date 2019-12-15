const aws = require('aws-sdk');
const { BUCKET_MP3, BUCKET_SRC } = require('../config/constants');
const ffmpeg = require('fluent-ffmpeg');

const encodeAacFrag = (downloadSrc, outputAudio) =>
  new Promise((resolve, reject) => {
    ffmpeg(downloadSrc)
      .audioCodec('libfdk_aac')
      .audioBitrate(128)
      .toFormat('mp4')
      // .on('stderr', () => {})
      .output(outputAudio)
      .outputOptions([
        '-frag_duration 15000000',
        '-movflags default_base_moof+empty_moov'
      ])
      .on('error', error => {
        reject(`Transcoding error: ${error.message}`);
      })
      .on('end', async () => resolve())
      .run();
  });

const encodeFlacStream = ({ req, tempPath, onEnd }) =>
  ffmpeg(req.file.stream)
    .audioCodec('flac')
    .audioChannels(2)
    .toFormat('flac')
    .outputOptions('-compression_level 5')
    .on('end', () => onEnd())
    .on('error', error => {
      throw new Error(error);
    })
    .save(tempPath);

const encodeMp3 = (res, release) =>
  new Promise((resolve, reject) => {
    const s3 = new aws.S3();
    const { trackList } = release;
    const releaseId = release._id.toString();

    s3.listObjectsV2(
      { Bucket: BUCKET_SRC, Prefix: releaseId },
      (error, data) => {
        if (error) reject(error);

        const encodeTracks = data.Contents.map(
          s3Track =>
            new Promise(done => {
              const { Key } = s3Track;
              const trackId = trackList.filter(track =>
                Key.includes(track._id)
              )[0]._id;

              const trackSrc = s3
                .getObject({ Bucket: BUCKET_SRC, Key })
                .createReadStream();

              const encode = ffmpeg(trackSrc)
                .audioCodec('libmp3lame')
                .toFormat('mp3')
                .outputOptions('-q:a 0')
                .on('error', encodingError => {
                  reject(`Transcoding error: ${encodingError.message}`);
                });

              const uploadParams = {
                Bucket: BUCKET_MP3,
                ContentType: 'audio/mp3',
                Key: `${releaseId}/${trackId}.mp3`,
                Body: encode.pipe()
              };

              s3.upload(uploadParams)
                .promise()
                .then(() => {
                  done();
                });
            })
        );

        Promise.all(encodeTracks).then(resolve());
      }
    );
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

module.exports = {
  encodeAacFrag,
  encodeFlacStream,
  encodeMp3,
  getTrackDuration
};
