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

const fadeAudio = (audioElement, fadeDirection, duration = fadeDirection === "out" ? 50 : 20) =>
  new Promise(resolve => {
    if (!audioElement) return void resolve();
    const initialVolume = audioElement.volume;
    const start = performance.now();

    const fade =
      fadeDirection === "out"
        ? t => initialVolume * Math.cos(((t - start) * (Math.PI / 2)) / duration)
        : t => (1 - initialVolume) * Math.sin(((t - start) * (Math.PI / 2)) / duration) + initialVolume;

    const tick = timestamp => {
      const elapsed = timestamp - start;
      if (elapsed >= duration) {
        audioElement.volume = fadeDirection === "out" ? 0 : 1;
        resolve();
      } else {
        audioElement.volume = Math.min(1, Math.max(0, fade(timestamp)));
        requestAnimationFrame(tick);
      }
    };

    requestAnimationFrame(tick);
  });

const fetchDownloadToken = async releaseId => {
  const res = await axios.post("/api/download", { releaseId });
  return res.headers.authorization.split(" ")[1];
};

const formatPrice = value => {
  const [integer = 0, float = 0] = value.toString().split(".");
  const priceAsFloatString = `${integer}.${float}`;
  const rounded = +(Math.ceil(Math.abs(priceAsFloatString) + "e+2") + "e-2");
  const price = Number.isNaN(rounded) ? Number.MAX_SAFE_INTEGER.toFixed(2) : rounded.toFixed(2);
  return price;
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
  fadeAudio,
  fetchDownloadToken,
  formatPrice,
  generateKey
};
