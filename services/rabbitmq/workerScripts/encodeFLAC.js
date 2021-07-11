import { AWS_REGION, BUCKET_SRC, TEMP_PATH } from '../../../config/constants.js';
import { QUEUE_TRANSCODE } from '../../../config/constants.js';
import { parentPort, workerData } from 'worker_threads';
import Release from '../../../models/Release.js';
import aws from 'aws-sdk';
import { encodeFlacStream } from '../../../controllers/encodingController.js';
import fs from 'fs';
import { mongoURI } from '../../../config/keys.js';
import mongoose from 'mongoose';
import path from 'path';
aws.config.update({ region: AWS_REGION });
const fsPromises = fs.promises;

const encodeFlac = async () => {
  const { filePath, releaseId, trackId, trackName, userId } = workerData;

  let db;
  let release;
  let trackDoc;

  try {
    db = await mongoose.connect(mongoURI, {
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

    parentPort.postMessage({ type: 'updateTrackStatus', releaseId, trackId, status: 'encoding', userId });
    const readFile = fs.createReadStream(filePath);
    const flacPath = path.resolve(TEMP_PATH, `${trackId}.flac`);

    const onProgress = ({ targetSize, timemark }) => {
      const [hours, mins, seconds] = timemark.split(':');
      const [s] = seconds.split('.');
      const h = hours !== '00' ? `${hours}:` : '';

      parentPort.postMessage({
        message: `Encoded FLAC: ${h}${mins}:${s} (${targetSize}kB complete)`,
        trackId,
        type: 'encodingProgressFLAC',
        userId
      });
    };

    await encodeFlacStream(readFile, flacPath, onProgress);
    const readFlac = fs.createReadStream(flacPath);
    const Key = `${releaseId}/${trackId}.flac`;
    const params = { Bucket: BUCKET_SRC, Key, Body: readFlac };
    const s3 = new aws.S3();

    await s3
      .upload(params)
      .on('httpUploadProgress', event => {
        const percent = Math.floor((event.loaded / event.total) * 100);

        parentPort.postMessage({
          message: `Saving FLAC (${percent}% complete)`,
          trackId,
          type: 'storingProgressFLAC',
          userId
        });
      })
      .promise();

    trackDoc = release.trackList.id(trackId);
    trackDoc.status = 'encoded';
    trackDoc.dateUpdated = Date.now();
    await release.save();
    parentPort.postMessage({ type: 'updateTrackStatus', releaseId, trackId, status: 'encoded', userId });
    parentPort.postMessage({ type: 'encodingCompleteFLAC', trackId, trackName, userId });

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
    if (trackDoc) {
      trackDoc.status = 'error';
      trackDoc.dateUpdated = Date.now();
      await release.save();
      await db.disconnect();
    }

    parentPort.postMessage({ type: 'updateTrackStatus', releaseId, trackId, status: 'error', userId });
    await fsPromises.unlink(filePath).catch(() => {});
    await db.disconnect();
    throw error;
  }
};

encodeFlac();
