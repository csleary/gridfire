import Release from '../models/Release.js';
import { encodeMp3 } from './ffmpeg.js';
import postMessage from './postMessage.js';

const transcodeMP3 = async ({ releaseId, userId }) => {
  const release = await Release.findById(releaseId, 'trackList', { lean: true }).exec();

  const onProgress = ({ targetSize, timemark }) => {
    const [hours, mins, seconds] = timemark.split(':');
    const [s] = seconds.split('.');
    const h = hours !== '00' ? `${hours}:` : '';
    postMessage({ message: `Transcoded MP3: ${h}${mins}:${s} (${targetSize}kB complete)`, userId });
  };

  await encodeMp3(release, onProgress);
  postMessage({ type: 'transcodingCompleteMP3', exists: true, format: 'mp3', releaseId, userId });
};

export default transcodeMP3;
