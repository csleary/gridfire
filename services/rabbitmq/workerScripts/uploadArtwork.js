const { AWS_REGION, BUCKET_IMG } = require('../../../config/constants');
// const { workerData, parentPort } = require('worker_threads');
const Release = require('../../../models/Release');
const aws = require('aws-sdk');
const fs = require('fs');
const fsPromises = fs.promises;
// const keys = require('../../../config/keys');
// const mongoose = require('mongoose');
const sharp = require('sharp');
aws.config.update({ region: AWS_REGION });
const s3 = new aws.S3();

const uploadArtwork = async (workerData, io) => {
  const { filePath, releaseId, userId } = workerData;
  const operatorUser = io.to(userId.toString());

  try {
    // await mongoose.connect(keys.mongoURI, {
    //   useFindAndModify: false,
    //   useCreateIndex: true,
    //   useNewUrlParser: true,
    //   useUnifiedTopology: true
    // });

    const release = await Release.findByIdAndUpdate(
      releaseId,
      { $set: { 'artwork.status': 'storing', 'artwork.dateCreated': Date.now() } },
      { new: true }
    ).exec();

    // parentPort.postMessage({ message: 'Optimising and storing artwork…', userId });
    console.log('workerMessage');
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

    // parentPort.postMessage({ type: 'artworkUploaded', userId });
    console.log('artworkUploaded');
    operatorUser.emit('artworkUploaded');

    await fsPromises.unlink(filePath);
    // await mongoose.disconnect();
  } catch (error) {
    await fsPromises.unlink(filePath).catch(() => {});
    // await mongoose.disconnect();
    throw error;
  }
};

// uploadArtwork();
module.exports = uploadArtwork;
