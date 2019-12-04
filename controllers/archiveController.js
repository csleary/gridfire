const archiver = require('archiver');
const aws = require('aws-sdk');
const {
  AWS_REGION,
  BUCKET_IMG,
  BUCKET_MP3,
  BUCKET_SRC
} = require('../config/constants');

aws.config.update({ region: AWS_REGION });

const zipDownload = async (res, release, format) => {
  const archive = archiver('zip');
  const s3 = new aws.S3();
  const Bucket = format === 'flac' ? BUCKET_SRC : BUCKET_MP3;
  const { artistName, releaseTitle, trackList } = release;
  const releaseId = release._id.toString();

  const s3ListAudioMp3 = await s3
    .listObjectsV2({ Bucket, Prefix: releaseId })
    .promise();

  archive.on('end', () => {});
  archive.on('warning', () => {});
  archive.on('error', () => {});

  res.attachment(`${artistName} - ${releaseTitle}.zip`);
  archive.pipe(res);

  s3ListAudioMp3.Contents.forEach(s3Track => {
    const { Key } = s3Track;
    const ext = Key.substring(Key.lastIndexOf('.'));

    const trackNumber =
      trackList.findIndex(track => Key.includes(track._id)) + 1;

    const title = trackList.filter(track => Key.includes(track._id))[0]
      .trackTitle;

    const trackSrc = s3.getObject({ Bucket, Key }).createReadStream();

    archive.append(trackSrc, {
      name: `${trackNumber.toString(10).padStart(2, '0')} ${title}${ext}`
    });
  });

  const s3ListArt = await s3
    .listObjectsV2({ Bucket: BUCKET_IMG, Prefix: releaseId })
    .promise();

  const Key = s3ListArt.Contents[0].Key;
  const artSrc = s3.getObject({ Bucket: BUCKET_IMG, Key }).createReadStream();

  archive.append(artSrc, {
    name: `${artistName} - ${releaseTitle}.jpg`
  });

  archive.finalize();
};

module.exports = {
  zipDownload
};
