const aws = require('aws-sdk');
const { BUCKET_MP3, BUCKET_SRC } = require('../config/constants');
const ffmpeg = require('fluent-ffmpeg');

const generateMp3 = (res, release) =>
  new Promise(async (resolve, reject) => {
    const s3 = new aws.S3();
    const { trackList } = release;
    const releaseId = release._id.toString();

    const s3ListAudioSrc = await s3
      .listObjectsV2({ Bucket: BUCKET_SRC, Prefix: releaseId })
      .promise();

    const encodeTracks = s3ListAudioSrc.Contents.map(
      s3Track =>
        new Promise(done => {
          const { Key } = s3Track;
          const trackId = trackList.filter(track => Key.includes(track._id))[0]
            ._id;

          const trackSrc = s3
            .getObject({ Bucket: BUCKET_SRC, Key })
            .createReadStream();

          const encode = ffmpeg(trackSrc)
            .audioCodec('libmp3lame')
            .toFormat('mp3')
            .outputOptions('-q:a 0')
            .on('error', error => {
              reject(`Transcoding error: ${error.message}`);
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
    Promise.all(encodeTracks).then(() => resolve());
  });

module.exports = {
  generateMp3
};
