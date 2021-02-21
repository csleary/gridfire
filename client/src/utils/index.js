import axios from 'axios';

const checkFormatMp3 = async token => {
  return axios.get('/api/download/check', { headers: { Authorization: `Bearer ${token}` } });
};

const fetchDownloadToken = async releaseId => {
  const res = await axios.post('/api/download', { releaseId });
  return res.headers.authorization.split(' ')[1];
};

export { checkFormatMp3, fetchDownloadToken };
