import { AWS_REGION, BUCKET_IMG } from '../config/constants.js';
import Release from '../models/Release.js';
import aws from 'aws-sdk';
import fs from 'fs';
import sharp from 'sharp';

aws.config.update({ region: AWS_REGION });
const fsPromises = fs.promises;

const deleteArtwork = async (releaseId, release) => {
  release.updateOne({ $set: { 'artwork.status': 'deleting', 'artwork.dateUpdated': Date.now() } }).exec();
  const listImgParams = { Bucket: BUCKET_IMG, Prefix: `${releaseId}` };
  const s3 = new aws.S3();
  const s3ImgData = await s3.listObjectsV2(listImgParams).promise();

  if (s3ImgData.Contents.length) {
    const deleteImgParams = {
      Bucket: BUCKET_IMG,
      Key: s3ImgData.Contents[0].Key
    };

    await s3.deleteObject(deleteImgParams).promise();

    const updatedRelease = await Release.findByIdAndUpdate(
      releaseId,
      { $set: { 'artwork.status': 'deleted', 'artwork.dateUpdated': Date.now(), published: false } },
      { new: true }
    ).exec();

    return updatedRelease.toJSON();
  } else {
    release
      .updateOne({ $set: { 'artwork.status': 'error', 'artwork.dateUpdated': Date.now(), published: false } })
      .exec();
    throw new Error('Artwork file not found. Please upload a new file.');
  }
};

const uploadArtwork = async (workerData, io) => {
  const s3 = new aws.S3();
  const { filePath, releaseId, userId } = workerData;
  const operatorUser = io.to(userId.toString());

  try {
    const release = await Release.findByIdAndUpdate(
      releaseId,
      { $set: { 'artwork.status': 'storing', 'artwork.dateCreated': Date.now() } },
      { new: true }
    ).exec();

    operatorUser.emit('workerMessage', { message: 'Optimising and storing artwork…' });
    const file = fs.createReadStream(filePath);
    const optimisedImg = sharp().resize(1000, 1000).toFormat('jpeg');
    const s3Stream = file.pipe(optimisedImg);

    const params = {
      ContentType: 'image/jpeg',
      Body: s3Stream,
      Bucket: BUCKET_IMG,
      Key: `${releaseId}.jpg`
    };

    await s3
      .upload(params)
      .promise()
      .catch(error => console.log(error));

    await release.updateOne({ $set: { 'artwork.status': 'stored', 'artwork.dateUpdated': Date.now() } }).exec();

    operatorUser.emit('artworkUploaded');
    await fsPromises.unlink(filePath);
  } catch (error) {
    await fsPromises.unlink(filePath).catch(() => {});
    throw error;
  }
};

export { deleteArtwork, uploadArtwork };
