const { parentPort, workerData } = require('worker_threads');
const { encodeMp3 } = require('../../../controllers/encodingController');
const keys = require('../../../config/keys');
const mongoose = require('mongoose');
require('../../../models/Release');
const Release = mongoose.model('releases');

const work = async () => {
  const { releaseId, userId } = workerData;
  let db;

  try {
    db = await mongoose.connect(keys.mongoURI, {
      useFindAndModify: false,
      useCreateIndex: true,
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    const release = await Release.findById(releaseId, 'trackList', { lean: true }).exec();

    const onProgress = ({ targetSize, timemark }) => {
      const [hours, mins, seconds] = timemark.split(':');
      const [s] = seconds.split('.');
      const h = hours !== '00' ? `${hours}:` : '';

      parentPort.postMessage({
        message: `Encoding mp3 at track time: ${h}${mins}:${s} (${targetSize}kB complete)`,
        userId
      });
    };

    await encodeMp3(release, onProgress);
    parentPort.postMessage({ type: 'encodingCompleteMP3', exists: true, format: 'mp3', releaseId, userId });
    await db.disconnect();
  } catch (error) {
    process.exit(1);
  }
};

work();
