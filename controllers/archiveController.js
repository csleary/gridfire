const archiver = require('archiver');
const aws = require('aws-sdk');
const { AWS_REGION, BUCKET_IMG, BUCKET_MP3, BUCKET_SRC } = require('../config/constants');
aws.config.update({ region: AWS_REGION });

const zipDownload = async (res, release, format) => {
  const Bucket = format === 'flac' ? BUCKET_SRC : BUCKET_MP3;
  const { artistName, releaseTitle, trackList } = release;
  const releaseId = release._id.toString();
  const s3 = new aws.S3();
  const archive = archiver('zip');
  // archive.on('progress', ({ entries, fs }) => {});
  archive.on('end', () => {});
  archive.on('warning', () => {});
  archive.on('error', () => {});
  res.attachment(`${artistName} - ${releaseTitle}.zip`);
  archive.pipe(res);

  for (const track of trackList) {
    const { _id: trackId, trackTitle } = track;
    const { Contents, KeyCount } = await s3.listObjectsV2({ Bucket, Prefix: `${releaseId}/${trackId}` }).promise();
    if (!KeyCount) throw new Error('Track not found for archiving.');
    const [{ Key }] = Contents;
    const ext = Key.substring(Key.lastIndexOf('.'));
    const trackNumber = trackList.findIndex(({ _id }) => _id === trackId) + 1;
    const trackSrc = s3.getObject({ Bucket, Key }).createReadStream();
    archive.append(trackSrc, { name: `${trackNumber.toString(10).padStart(2, '0')} ${trackTitle}${ext}` });
  }

  const { Contents, KeyCount } = await s3.listObjectsV2({ Bucket: BUCKET_IMG, Prefix: releaseId }).promise();
  if (!KeyCount) throw new Error('Release artwork not found for archiving.');
  const Key = Contents[0].Key;
  const artSrc = s3.getObject({ Bucket: BUCKET_IMG, Key }).createReadStream();
  archive.append(artSrc, { name: `${artistName} - ${releaseTitle}.jpg` });
  await archive.finalize();
};

module.exports = { zipDownload };
