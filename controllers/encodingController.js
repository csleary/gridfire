import aws from 'aws-sdk';
import { BUCKET_MP3, BUCKET_SRC } from '../config/constants.js';
import ffmpeg from 'fluent-ffmpeg';

const encodeAacFrag = (downloadSrc, outputAudio, onProgress) =>
  new Promise((resolve, reject) => {
    ffmpeg(downloadSrc)
      // .audioCodec('libfdk_aac')
      .audioCodec('aac')
      .audioBitrate(128)
      .toFormat('mp4')
      // .on('start', () => {})
      // .on('codecData', ({ duration }) => {
      //   postMessage(duration);
      // })
      .on('progress', onProgress)
      .on('stderr', () => {})
      .on('error', error => reject(error.message))
      .output(outputAudio)
      .outputOptions(['-frag_duration 15000000', '-movflags default_base_moof+empty_moov'])
      .on('error', error => reject(`Transcoding error: ${error.toString()}`))
      .on('end', resolve)
      .run();
  });

const encodeFlacStream = (stream, outputPath, onProgress) =>
  new Promise((resolve, reject) => {
    ffmpeg(stream)
      .audioCodec('flac')
      .audioChannels(2)
      .toFormat('flac')
      .on('progress', onProgress)
      .outputOptions('-compression_level 5')
      .on('end', resolve)
      .on('error', error => reject(error.toString()))
      .save(outputPath);
  });

const encodeMp3 = async (release, onProgress) => {
  const { _id: releaseId, trackList } = release;
  const s3 = new aws.S3();

  for (const track of trackList) {
    const { _id: trackId } = track;
    const { Contents, KeyCount } = await s3
      .listObjectsV2({ Bucket: BUCKET_SRC, Prefix: `${releaseId}/${trackId}` })
      .promise();

    if (!KeyCount) throw 'Track not found for encoding.';
    const [{ Key }] = Contents;
    const trackSrc = s3.getObject({ Bucket: BUCKET_SRC, Key }).createReadStream();

    const encode = ffmpeg(trackSrc)
      .audioCodec('libmp3lame')
      .toFormat('mp3')
      .on('progress', onProgress)
      .outputOptions('-q:a 0')
      .on('error', encodingError => {
        throw new Error(`Mp3 transcoding error: ${encodingError.message}`);
      });

    const uploadParams = {
      Bucket: BUCKET_MP3,
      ContentType: 'audio/mp3',
      Key: `${releaseId}/${trackId}.mp3`,
      Body: encode.pipe()
    };

    await s3.upload(uploadParams).promise();
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

export { encodeAacFrag, encodeFlacStream, encodeMp3, getTrackDuration };
