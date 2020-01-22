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
  const readStream = fs.createReadStream(filePath);

  const streamToS3 = async () => {
    const s3Stream = await fsPromises.readFile(outputPath);
    const Key = `${releaseId}/${trackId}.flac`;
    const params = { Bucket: BUCKET_SRC, Key, Body: s3Stream };
    parentPort.postMessage('Storing flac…');

    s3.upload(params)
      .promise()
      .then(fsPromises.unlink(filePath))
      .then(fsPromises.unlink(outputPath));
  };

  parentPort.postMessage('Encoding flac…');
  encodeFlacStream(readStream, outputPath, streamToS3);
})();
