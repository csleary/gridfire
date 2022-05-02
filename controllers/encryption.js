import { constants, createCipheriv, createDecipheriv, publicEncrypt, randomBytes, randomUUID, webcrypto } from "crypto";
import { Transform } from "stream";
import fs from "fs";
import path from "path";
import { pipeline } from "stream/promises";

const { TEMP_PATH } = process.env;

class PrependIV extends Transform {
  #isFirstChunk;
  #iv;

  constructor(iv) {
    super();
    this.#isFirstChunk = true;
    this.#iv = iv;
  }

  _transform(chunk, encoding, callback) {
    if (this.#isFirstChunk) {
      const prepended = Buffer.concat([this.#iv, chunk]);
      this.#isFirstChunk = false;
      callback(null, prepended);
    } else {
      callback(null, chunk);
    }
  }
}

const encryptStream = (unencryptedStream, key) => {
  const iv = Buffer.from(randomBytes(8).toString("hex"));
  const prependIV = new PrependIV(iv);
  const encrypt = createCipheriv("aes-256-cbc", Buffer.from(key), iv);
  const encryptedStream = unencryptedStream.pipe(encrypt).pipe(prependIV);
  return encryptedStream;
};

const decryptStream = async (encryptedStream, key) => {
  const encryptedFilename = randomUUID({ disableEntropyCache: true });
  const encryptedFilePath = path.resolve(TEMP_PATH, encryptedFilename);

  try {
    // Stream cipher to file to read IV from the beginning.
    const streamToDisk = fs.createWriteStream(encryptedFilePath);
    await pipeline(encryptedStream, streamToDisk);

    // Read and return IV.
    const getIVFromStream = fs.createReadStream(encryptedFilePath, { highWaterMark: 16 });

    const iv = await new Promise((resolve, reject) => {
      getIVFromStream.on("error", () => {
        getIVFromStream.destroy();
        reject();
      });

      getIVFromStream.on("readable", () => {
        const iv = getIVFromStream.read();
        getIVFromStream.destroy();
        resolve(iv);
      });
    });

    // Decrypt remainder of the stream, skipping the IV.
    const decrypt = createDecipheriv("aes-256-cbc", Buffer.from(key), iv);
    const encryptedFileStream = fs.createReadStream(encryptedFilePath, { start: 16 });
    const decryptedStream = encryptedFileStream.pipe(decrypt);

    // Delete temp file.
    decryptedStream.on("close", () => fs.promises.unlink(encryptedFilePath));
    return decryptedStream;
  } catch (error) {
    if (encryptedFilePath) fs.promises.unlink(encryptedFilePath).catch(console.log);
    console.log(error);
    throw error;
  }
};

const encryptString = async (publicKey, string) => {
  const keysBuffer = Buffer.from(string);
  const algorithm = { name: "RSA-OAEP", hash: "SHA-256" };
  const cryptoKey = await webcrypto.subtle.importKey("jwk", publicKey, algorithm, false, ["encrypt"]);
  const padding = constants.RSA_PKCS1_OAEP_PADDING;
  const cipherConfig = { key: cryptoKey, padding, oaepHash: "sha256" };
  const cipherBuffer = publicEncrypt(cipherConfig, keysBuffer);
  return cipherBuffer;
};

export { encryptStream, encryptString, decryptStream };
