import axios from "axios";
const { crypto } = window;

const checkFormatMp3 = async token => {
  return axios.get("/api/download/check", { headers: { Authorization: `Bearer ${token}` } });
};

const createObjectId = () => {
  const timestamp = ((Date.now() / 1000) | 0).toString(16);
  const randomBytes = Array.from(window.crypto.getRandomValues(new Uint8Array(8)));
  const randomHex = randomBytes.map(byte => `0${byte.toString(16)}`.slice(-2)).join("");
  return `${timestamp}${randomHex}`;
};

const encryptArrayBuffer = async (publicKey, arrayBuffer) => {
  const algorithm = { name: "RSA-OAEP", hash: "SHA-256" };
  const cryptoKey = await crypto.subtle.importKey("jwk", publicKey, algorithm, false, ["encrypt"]);
  const cipherBuffer = await crypto.subtle.encrypt({ name: "RSA-OAEP" }, cryptoKey, arrayBuffer);
  return cipherBuffer;
};

const decryptArrayBuffer = async (privateKey, encryptedBuffer) => {
  const decipherConfig = { name: "RSA-OAEP", hash: "SHA-256" };
  const decryptedBuffer = await crypto.subtle.decrypt(decipherConfig, privateKey, encryptedBuffer);
  return decryptedBuffer;
};

const exportKeyToJWK = async publicKey => {
  const jwk = await crypto.subtle.exportKey("jwk", publicKey);
  return jwk;
};

const fetchDownloadToken = async releaseId => {
  const res = await axios.post("/api/download", { releaseId });
  return res.headers.authorization.split(" ")[1];
};

const generateKey = async () => {
  const publicExponent = new Uint8Array([1, 0, 1]);
  const algorithm = { name: "RSA-OAEP", modulusLength: 4096, publicExponent, hash: "SHA-256" };
  const extractable = false;
  const keyUsages = ["encrypt", "decrypt"];
  return crypto.subtle.generateKey(algorithm, extractable, keyUsages);
};

export {
  checkFormatMp3,
  createObjectId,
  decryptArrayBuffer,
  encryptArrayBuffer,
  exportKeyToJWK,
  fetchDownloadToken,
  generateKey
};
