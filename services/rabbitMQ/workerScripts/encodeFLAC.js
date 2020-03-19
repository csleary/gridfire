const {
  AWS_REGION,
  BUCKET_SRC,
  TEMP_PATH
} = require('../../../config/constants');
const aws = require('aws-sdk');
const { encodeFlacStream } = require('../../../controllers/encodingController');
const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');
const { parentPort, workerData } = require('worker_threads');
aws.config.update({ region: AWS_REGION });

(async () => {
  const { releaseId, trackId, filePath } = workerData;
  const s3 = new aws.S3();
  const outputPath = path.join(TEMP_PATH, `${trackId}.flac`);
  const readFile = fs.createReadStream(filePath);
  parentPort.postMessage('Encoding flac…');
  await encodeFlacStream(readFile, outputPath);
  const readFlac = fs.createReadStream(outputPath);
  const Key = `${releaseId}/${trackId}.flac`;
  const params = { Bucket: BUCKET_SRC, Key, Body: readFlac };
  await s3.upload(params).promise();
  await fsPromises.unlink(filePath);
  await fsPromises.unlink(outputPath);
})();
