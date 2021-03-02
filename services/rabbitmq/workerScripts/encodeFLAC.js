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
  let db;
  let release;
  let trackDoc;

  try {
    db = await mongoose.connect(keys.mongoURI, {
      useFindAndModify: false,
      useCreateIndex: true,
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    parentPort.postMessage({ message: 'Encoding flac…', userId });

    release = await Release.findOneAndUpdate(
      { _id: releaseId, 'trackList._id': trackId },
      { $set: { 'trackList.$.status': 'encoding', 'trackList.$.dateUpdated': Date.now() } },
      { new: true }
    ).exec();

    parentPort.postMessage({ type: 'updateActiveRelease', releaseId });
    const readFile = fs.createReadStream(filePath);
    const flacPath = path.join(TEMP_PATH, `${trackId}.flac`);

    const onProgress = ({ targetSize, timemark }) => {
      const [hours, mins, seconds] = timemark.split(':');
      const [s] = seconds.split('.');
      const h = hours !== '00' ? `${hours}:` : '';

      parentPort.postMessage({
        message: `Encoding at track time: ${h}${mins}:${s} (${targetSize}kB complete)`,
        userId
      });
    };

    await encodeFlacStream(readFile, flacPath, onProgress);
    const readFlac = fs.createReadStream(flacPath);
    const Key = `${releaseId}/${trackId}.flac`;
    const params = { Bucket: BUCKET_SRC, Key, Body: readFlac };
    const s3 = new aws.S3();
    await s3.upload(params).promise();

    trackDoc = release.trackList.id(trackId);
    trackDoc.status = 'encoded';
    trackDoc.dateUpdated = Date.now();
    await release.save();
    parentPort.postMessage({ type: 'updateActiveRelease', releaseId });
    parentPort.postMessage({ type: 'EncodingCompleteFLAC', trackId, trackName, userId });

    parentPort.postMessage({
      type: 'publishToQueue',
      job: 'transcodeAAC',
      queue: QUEUE_TRANSCODE,
      releaseId,
      trackId,
      trackName,
      userId
    });

    await fsPromises.unlink(filePath);
    await db.disconnect();
  } catch (error) {
    console.error(error);

    if (trackDoc) {
      trackDoc.status = 'error';
      trackDoc.dateUpdated = Date.now();
      await release.save();
      await db.disconnect();
    }

    parentPort.postMessage({ type: 'updateActiveRelease', releaseId });
    process.exit(1);
  }
};

encodeFlac();
