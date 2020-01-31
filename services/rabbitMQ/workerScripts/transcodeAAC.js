const {
  AWS_REGION,
  BUCKET_OPT,
  BUCKET_SRC,
  TEMP_PATH
} = require('../../../config/constants');
const {
  encodeAacFrag,
  getTrackDuration
} = require('../../../controllers/encodingController');
const { parentPort, workerData } = require('worker_threads');
const aws = require('aws-sdk');
const { createMpd } = require('../../../controllers/bento4Controller');
const fsPromises = require('fs').promises;
const keys = require('../../../config/keys');
const mongoose = require('mongoose');
const path = require('path');
require('../../../models/Release');
aws.config.update({ region: AWS_REGION });

const Release = mongoose.model('releases');

(async () => {
  try {
    const { releaseId, trackId } = workerData;

    const listParams = {
      Bucket: BUCKET_SRC,
      Prefix: `${releaseId}/${trackId}`
    };

    const s3 = new aws.S3();
    const inputAudio = await s3.listObjectsV2(listParams).promise();
    const { Key } = inputAudio.Contents[0];
    const outputAudio = path.join(TEMP_PATH, `${trackId}.mp4`);
    const outputMpd = path.join(TEMP_PATH, `${trackId}.mpd`);

    const probeSrc = s3
      .getObject({ Bucket: BUCKET_SRC, Key })
      .createReadStream();

    const metadata = await getTrackDuration(probeSrc);

    await mongoose.connect(keys.mongoURI, {
      useFindAndModify: false,
      useCreateIndex: true,
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    const release = await Release.findById(releaseId);
    const trackDoc = release.trackList.id(trackId);
    trackDoc.duration = metadata.format.duration;
    await release.save();

    parentPort.postMessage({
      type: 'transcodeDuration',
      duration: metadata.format.duration
    });

    const downloadSrc = s3
      .getObject({ Bucket: BUCKET_SRC, Key })
      .createReadStream();

    parentPort.postMessage('Transcoding streaming aac…');
    await encodeAacFrag(downloadSrc, outputAudio);
    createMpd(outputAudio, trackId, TEMP_PATH);
    const mp4Audio = await fsPromises.readFile(outputAudio);

    const mp4Params = {
      Bucket: BUCKET_OPT,
      ContentType: 'audio/mp4',
      Key: `mp4/${releaseId}/${trackId}.mp4`,
      Body: mp4Audio
    };

    const mp4Upload = s3.upload(mp4Params).promise();
    const mpd = await fsPromises.readFile(outputMpd);

    const mpdParams = {
      Bucket: BUCKET_OPT,
      ContentType: 'application/dash+xml',
      Key: `mpd/${releaseId}/${trackId}.mpd`,
      Body: mpd
    };

    const mpdUpload = s3.upload(mpdParams).promise();
    parentPort.postMessage('Uploading streaming audio…');
    await Promise.all([mp4Upload, mpdUpload]);
    trackDoc.hasAudio = true;
    await release.save();
    await fsPromises.unlink(outputAudio);
    await fsPromises.unlink(outputMpd);
    await mongoose.disconnect();
  } catch (error) {
    throw new Error(error);
  }
})();
