import axios from 'axios';

const checkFormatMp3 = async token => {
  const res = await axios.get(`/api/download/${token}/check`);
  return res.data;
};

const fetchDownloadToken = async releaseId => {
  const res = await axios.post('/api/download', { releaseId });
  return res.headers.authorization;
};

export { checkFormatMp3, fetchDownloadToken };
