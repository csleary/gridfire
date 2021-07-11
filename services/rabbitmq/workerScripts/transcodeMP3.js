import { parentPort, workerData } from 'worker_threads';
import Release from '../../../models/Release.js';
import { encodeMp3 } from '../../../controllers/encodingController.js';
import { mongoURI } from '../../../config/keys.js';
import mongoose from 'mongoose';

const work = async () => {
  const { releaseId, userId } = workerData;
  let db;

  try {
    db = await mongoose.connect(mongoURI, {
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
        message: `Transcoded MP3: ${h}${mins}:${s} (${targetSize}kB complete)`,
        userId
      });
    };

    await encodeMp3(release, onProgress);
    parentPort.postMessage({ type: 'transcodingCompleteMP3', exists: true, format: 'mp3', releaseId, userId });
    await db.disconnect();
  } catch (error) {
    await db.disconnect();
    throw error;
  }
};

work();
