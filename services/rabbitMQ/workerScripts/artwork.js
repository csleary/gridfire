const { AWS_REGION, BUCKET_IMG } = require('../../../config/constants');
const aws = require('aws-sdk');
const keys = require('../../../config/keys');
const fs = require('fs');
const fsPromises = require('fs').promises;
const mongoose = require('mongoose');
const sharp = require('sharp');
const { workerData } = require('worker_threads');
const { parentPort } = require('worker_threads');
require('../../../models/Release');
aws.config.update({ region: AWS_REGION });

const Release = mongoose.model('releases');

(async () => {
  try {
    const { filePath, releaseId } = workerData;

    await mongoose.connect(keys.mongoURI, {
      useFindAndModify: false,
      useCreateIndex: true,
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    const release = await Release.findByIdAndUpdate(
      releaseId,
      { artwork: 'storing' },
      { new: true }
    ).exec();

    parentPort.postMessage('Optimising and storing artwork…');

    const optimisedImg = sharp()
      .resize(1000, 1000)
      .toFormat('jpeg');

    const file = fs.createReadStream(filePath);
    const s3Stream = file.pipe(optimisedImg);
    const s3 = new aws.S3();

    const params = {
      ContentType: 'image/jpeg',
      Body: s3Stream,
      Bucket: BUCKET_IMG,
      Key: `${releaseId}.jpg`
    };

    await s3.upload(params).promise();
    await release.updateOne(releaseId, { artwork: 'stored' }).exec();
    await fsPromises.unlink(filePath);
    await mongoose.disconnect();
  } catch (error) {
    throw new Error(error);
  }
})();
