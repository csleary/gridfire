const { AWS_REGION, BUCKET_SRC, TEMP_PATH } = require('../../../config/constants');
const { QUEUE_TRANSCODE } = require('../../../config/constants');
const { parentPort, workerData } = require('worker_threads');
const aws = require('aws-sdk');
const { encodeFlacStream } = require('../../../controllers/encodingController');
const fs = require('fs');
const fsPromises = require('fs').promises;
const keys = require('../../../config/keys');
const mongoose = require('mongoose');
const path = require('path');
require('../../../models/Release');

aws.config.update({ region: AWS_REGION });
const Release = mongoose.model('releases');

const encodeFlac = async () => {
  const { filePath, releaseId, trackId, trackName, userId } = workerData;

  await mongoose.connect(keys.mongoURI, {
    useFindAndModify: false,
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

  const outputPath = path.join(TEMP_PATH, `${trackId}.flac`);
  const readFile = fs.createReadStream(filePath);
  parentPort.postMessage({ message: 'Encoding flac…', userId });

  const release = await Release.findOneAndUpdate(
    { _id: releaseId, 'trackList._id': trackId },
    { $set: { 'trackList.$.status': 'encoding', 'trackList.$.dateUpdated': new Date(Date.now()) } },
    { new: true }
  ).exec();

  parentPort.postMessage({ type: 'updateRelease', releaseId });
  await encodeFlacStream(readFile, outputPath);
  const readFlac = fs.createReadStream(outputPath);
  const Key = `${releaseId}/${trackId}.flac`;
  const params = { Bucket: BUCKET_SRC, Key, Body: readFlac };
  const s3 = new aws.S3();
  await s3.upload(params).promise();

  const trackDoc = release.trackList.id(trackId);
  trackDoc.status = 'encoded';
  trackDoc.dateUpdated = new Date(Date.now());
  await release.save();
  parentPort.postMessage({ type: 'updateRelease', releaseId });
  parentPort.postMessage({ type: 'EncodingCompleteFlac', trackId, trackName, userId });

  parentPort.postMessage({
    type: 'publishToQueue',
    job: 'transcodeAac',
    queue: QUEUE_TRANSCODE,
    releaseId,
    trackId,
    trackName,
    userId
  });

  await fsPromises.unlink(filePath);
  await fsPromises.unlink(outputPath);
  await mongoose.disconnect();
};

encodeFlac();
