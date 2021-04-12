const { AWS_REGION, BUCKET_OPT, TEMP_PATH } = require('../../../config/constants');
const { encodeAacFrag, getTrackDuration } = require('../../../controllers/encodingController');
const { parentPort, workerData } = require('worker_threads');
const aws = require('aws-sdk');
const { createMpd } = require('../../../controllers/bento4Controller');
const fs = require('fs');
const fsPromises = fs.promises;
const keys = require('../../../config/keys');
const mongoose = require('mongoose');
const path = require('path');
const sax = require('sax');
require('../../../models/Release');
aws.config.update({ region: AWS_REGION });
const Release = mongoose.model('releases');

const removeTempFiles = async (mp4Path, flacPath, playlistDir) => {
  const dirContents = await fsPromises.readdir(playlistDir);
  const deleteFiles = dirContents.map(file => fsPromises.unlink(path.join(playlistDir, file)));
  const outcome = await Promise.allSettled([fsPromises.unlink(mp4Path), fsPromises.unlink(flacPath), ...deleteFiles]);
  if (outcome.some(({ status }) => status === 'rejected')) return;
  await fsPromises.rmdir(playlistDir);
};

const work = async () => {
  const { releaseId, trackId, trackName, userId } = workerData;
  let db, release, trackDoc, mp4Path, flacPath, playlistDir;

  try {
    db = await mongoose.connect(keys.mongoURI, {
      useFindAndModify: false,
      useCreateIndex: true,
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    release = await Release.findById(releaseId).exec();
    trackDoc = release.trackList.id(trackId);
    trackDoc.status = 'transcoding';
    trackDoc.dateUpdated = Date.now();
    await release.save();
    parentPort.postMessage({ message: 'Transcoding to aac…', userId });
    parentPort.postMessage({ type: 'updateTrackStatus', releaseId, trackId, status: 'transcoding', userId });

    // Probe for track duration
    flacPath = path.join(TEMP_PATH, `${trackId}.flac`);
    const probeSrc = fs.createReadStream(flacPath);
    const metadata = await getTrackDuration(probeSrc);
    trackDoc.duration = metadata.format.duration;
    trackDoc.dateUpdated = Date.now();
    await release.save();

    // Transcode FLAC to AAC
    mp4Path = path.join(TEMP_PATH, `${trackId}.mp4`);
    const flacData = fs.createReadStream(flacPath);

    const onProgress = ({ targetSize, timemark }) => {
      const [hours, mins, seconds] = timemark.split(':');
      const [s] = seconds.split('.');
      const h = hours !== '00' ? `${hours}:` : '';

      parentPort.postMessage({
        message: `Encoding at track time: ${h}${mins}:${s} (${targetSize}kB complete)`,
        userId
      });
    };

    await encodeAacFrag(flacData, mp4Path, onProgress);
    playlistDir = path.join(TEMP_PATH, trackId);

    // Create and parse mpd
    createMpd(mp4Path, trackId, playlistDir);
    const outputMpd = path.join(playlistDir, `${trackId}.mpd`);
    const mpdData = await fsPromises.readFile(outputMpd);
    const strict = true;
    const parser = sax.parser(strict);
    const segmentList = [];

    parser.onopentag = node => {
      if (node.name === 'SegmentList') {
        trackDoc.segmentDuration = node.attributes.duration;
        trackDoc.segmentTimescale = node.attributes.timescale;
      }

      if (node.name === 'Initialization') {
        trackDoc.initRange = node.attributes.range;
      }
    };

    parser.onattribute = attr => {
      if (attr.name === 'mediaRange') {
        segmentList.push(attr.value);
      }
    };

    parser.write(mpdData).close();
    trackDoc.segmentList = segmentList;
    trackDoc.mpd = mpdData;

    // Upload AAC, playlists
    const mp4Audio = fs.createReadStream(mp4Path);
    const m3u8Master = await fsPromises.readFile(path.join(playlistDir, 'master.m3u8'));
    const m3u8Media = await fsPromises.readFile(path.join(playlistDir, 'audio-und-mp4a.m3u8'));

    const mp4Params = {
      Bucket: BUCKET_OPT,
      ContentType: 'audio/mp4',
      Key: `mp4/${releaseId}/${trackId}.mp4`,
      Body: mp4Audio
    };

    const m3u8MasterParams = {
      Bucket: BUCKET_OPT,
      ContentType: 'application/x-mpegURL',
      Key: `mp4/${releaseId}/${trackId}/master.m3u8`,
      Body: m3u8Master
    };

    const m3u8MediaParams = {
      Bucket: BUCKET_OPT,
      ContentType: 'application/x-mpegURL',
      Key: `mp4/${releaseId}/${trackId}/audio-und-mp4a.m3u8`,
      Body: m3u8Media
    };

    const uploads = [];
    const s3 = new aws.S3();
    uploads.push(s3.upload(mp4Params).promise());
    uploads.push(s3.upload(m3u8MasterParams).promise());
    uploads.push(s3.upload(m3u8MediaParams).promise());
    await Promise.allSettled(uploads);
    trackDoc.status = 'stored';
    trackDoc.dateUpdated = Date.now();
    await release.save();
    parentPort.postMessage({ type: 'encodingCompleteAAC', trackId, trackName, userId });
    parentPort.postMessage({ type: 'updateTrackStatus', releaseId, trackId, status: 'stored', userId });
    await removeTempFiles(mp4Path, flacPath, playlistDir);
    await db.disconnect();
  } catch (error) {
    console.error(error);

    if (trackDoc) {
      trackDoc.status = 'error';
      trackDoc.dateUpdated = Date.now();
      await release.save();
      await db.disconnect();
    }

    parentPort.postMessage({ type: 'updateTrackStatus', releaseId, trackId, status: 'error', userId });
    await removeTempFiles(mp4Path, flacPath, playlistDir);
    process.exit(1);
  }
};

work();
