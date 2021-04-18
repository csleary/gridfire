import axios from 'axios';

const checkFormatMp3 = async token => {
  return axios.get('/api/download/check', { headers: { Authorization: `Bearer ${token}` } });
};

const createClientId = async ({ idHash, nonce, paymentId }) => {
  const numbers = window.crypto.getRandomValues(new Uint8Array(16));
  const cnonce = Array.from(numbers, b => b.toString(16).padStart(2, '0')).join('');
  const encoder = new TextEncoder();
  const encoded = encoder.encode(cnonce.concat(idHash).concat(nonce).concat(paymentId));
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const clientId = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return { clientId, cnonce };
};

const createObjectId = () =>
  Array.from(window.crypto.getRandomValues(new Uint8Array(12)))
    .map(byte => ('0' + byte.toString(16)).slice(-2))
    .join('');

const fetchDownloadToken = async releaseId => {
  const res = await axios.post('/api/download', { releaseId });
  return res.headers.authorization.split(' ')[1];
};

export { checkFormatMp3, createClientId, createObjectId, fetchDownloadToken };
