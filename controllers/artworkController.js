const aws = require('aws-sdk');
const mongoose = require('mongoose');
const sharp = require('sharp');
const Release = mongoose.model('releases');
const { AWS_REGION, BUCKET_IMG } = require('../config/constants');
aws.config.update({ region: AWS_REGION });

const deleteArtwork = async (releaseId, release) => {
  release.updateOne({ artwork: 'deleting' }).exec();

  const listImgParams = {
    Bucket: BUCKET_IMG,
    Prefix: `${releaseId}`
  };

  const s3 = new aws.S3();
  const s3ImgData = await s3.listObjectsV2(listImgParams).promise();

  if (s3ImgData.Contents.length) {
    const deleteImgParams = {
      Bucket: BUCKET_IMG,
      Key: s3ImgData.Contents[0].Key
    };

    await s3.deleteObject(deleteImgParams).promise();

    const updated = await Release.findByIdAndUpdate(
      releaseId,
      { $unset: { artwork: 1 }, published: false },
      { lean: true, new: true, select: '-__v' }
    );

    return updated;
  } else {
    release.updateOne({ published: false }).exec();
    throw new Error('Artwork file not found. Please upload a new file.');
  }
};

const uploadArtwork = async (file, releaseId, release) => {
  release.updateOne({ artwork: 'storing' }).exec();

  const optimisedImg = sharp()
    .resize(1000, 1000)
    .toFormat('jpeg');

  const s3Stream = file.stream.pipe(optimisedImg);
  const s3 = new aws.S3();

  const params = {
    ContentType: 'image/jpeg',
    Body: s3Stream,
    Bucket: BUCKET_IMG,
    Key: `${releaseId}.jpg`
  };

  await s3.upload(params).promise();

  const updated = await Release.findByIdAndUpdate(
    releaseId,
    { artwork: 'stored' },
    { lean: true, new: true, select: '-__v' }
  );

  return updated;
};

module.exports = {
  deleteArtwork,
  uploadArtwork
};
