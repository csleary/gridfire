const { AWS_REGION, BUCKET_IMG } = require('../../../config/constants');
const aws = require('aws-sdk');
const keys = require('../../../config/keys');
const fs = require('fs');
const fsPromises = require('fs').promises;
const mongoose = require('mongoose');
const sharp = require('sharp');
const { workerData, parentPort } = require('worker_threads');
require('../../../models/Release');
aws.config.update({ region: AWS_REGION });

const Release = mongoose.model('releases');

const uploadArtwork = async () => {
  try {
    const { filePath, releaseId, userId } = workerData;

    await mongoose.connect(keys.mongoURI, {
      useFindAndModify: false,
      useCreateIndex: true,
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    const release = await Release.findByIdAndUpdate(
      releaseId,
      { $set: { 'artwork.status': 'storing', 'artwork.dateCreated': new Date(Date.now()) } },
      { new: true }
    ).exec();

    parentPort.postMessage({ message: 'Optimising and storing artwork…', userId });
    const file = fs.createReadStream(filePath);
    const optimisedImg = sharp().resize(1000, 1000).toFormat('jpeg');
    const s3Stream = file.pipe(optimisedImg);
    const s3 = new aws.S3();

    const params = {
      ContentType: 'image/jpeg',
      Body: s3Stream,
      Bucket: BUCKET_IMG,
      Key: `${releaseId}.jpg`
    };

    await s3.upload(params).promise();

    await release
      .updateOne({
        $set: {
          'artwork.status': 'stored',
          'artwork.dateUpdated': new Date(Date.now())
        }
      })
      .exec();

    parentPort.postMessage({ type: 'artworkUploaded', userId });
    await fsPromises.unlink(filePath);
    await mongoose.disconnect();
  } catch (error) {
    throw new Error(error);
  }
};

uploadArtwork();
