const { AWS_REGION, BUCKET_OPT, BUCKET_SRC, TEMP_PATH } = require('../../../config/constants');
const { encodeAacFrag, getTrackDuration } = require('../../../controllers/encodingController');
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

const work = async () => {
  const { releaseId, trackId, trackName, userId } = workerData;
  let release;
  let trackDoc;

  try {
    await mongoose.connect(keys.mongoURI, {
      useFindAndModify: false,
      useCreateIndex: true,
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    const listParams = { Bucket: BUCKET_SRC, Prefix: `${releaseId}/${trackId}` };
    release = await Release.findById(releaseId).exec();
    trackDoc = release.trackList.id(trackId);
    trackDoc.status = 'transcoding';
    trackDoc.dateUpdated = Date.now();
    await release.save();
    parentPort.postMessage({ message: 'Transcoding to aac…', userId });
    parentPort.postMessage({ type: 'updateActiveRelease', releaseId });

    const s3 = new aws.S3();
    const inputAudio = await s3.listObjectsV2(listParams).promise();
    const [{ Key }] = inputAudio.Contents;
    const probeSrc = s3.getObject({ Bucket: BUCKET_SRC, Key }).createReadStream();
    const metadata = await getTrackDuration(probeSrc);
    trackDoc.duration = metadata.format.duration;
    trackDoc.dateUpdated = Date.now();
    await release.save();
    const downloadSrc = s3.getObject({ Bucket: BUCKET_SRC, Key }).createReadStream();
    const outputAudio = path.join(TEMP_PATH, `${trackId}.mp4`);
    await encodeAacFrag(downloadSrc, outputAudio, parentPort);
    createMpd(outputAudio, trackId, TEMP_PATH);
    const mp4Audio = await fsPromises.readFile(outputAudio);

    const mp4Params = {
      Bucket: BUCKET_OPT,
      ContentType: 'audio/mp4',
      Key: `mp4/${releaseId}/${trackId}.mp4`,
      Body: mp4Audio
    };

    await s3.upload(mp4Params).promise();
    const outputMpd = path.join(TEMP_PATH, `${trackId}.mpd`);
    const mpdData = await fsPromises.readFile(outputMpd);
    trackDoc.mpd = mpdData;
    trackDoc.status = 'stored';
    trackDoc.dateUpdated = Date.now();
    await release.save();

    parentPort.postMessage({
      type: 'EncodingCompleteAac',
      trackId,
      trackName,
      userId
    });
    parentPort.postMessage({ type: 'updateActiveRelease', releaseId });

    await fsPromises.unlink(outputAudio);
    await fsPromises.unlink(outputMpd);
    await mongoose.disconnect();
  } catch (error) {
    console.error(error.message.toString());
    trackDoc.status = 'error';
    trackDoc.dateUpdated = Date.now();
    await release.save();
    parentPort.postMessage({ type: 'updateActiveRelease', releaseId });
    throw new Error(error);
  }
};

work();
