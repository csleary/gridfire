import axios from "axios";

const checkFormatMp3 = async token => {
  return axios.get("/api/download/check", { headers: { Authorization: `Bearer ${token}` } });
};

const createObjectId = () => {
  const timestamp = ((Date.now() / 1000) | 0).toString(16);
  const randomBytes = Array.from(window.crypto.getRandomValues(new Uint8Array(8)));
  const randomHex = randomBytes.map(byte => `0${byte.toString(16)}`.slice(-2)).join("");
  return `${timestamp}${randomHex}`;
};

const fetchDownloadToken = async releaseId => {
  const res = await axios.post("/api/download", { releaseId });
  return res.headers.authorization.split(" ")[1];
};

export { checkFormatMp3, createObjectId, fetchDownloadToken };
