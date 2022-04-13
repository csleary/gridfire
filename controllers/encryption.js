import { createCipheriv, createDecipheriv, randomBytes, randomUUID } from "crypto";
import { Transform } from "stream";
import fs from "fs";
import path from "path";

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

const encryptStream = async (unencryptedStream, key) => {
  const iv = Buffer.from(randomBytes(8).toString("hex"));
  const prependIV = new PrependIV(iv);
  const encrypt = createCipheriv("aes-256-cbc", Buffer.from(key), iv);
  const encrypted = unencryptedStream.pipe(encrypt).pipe(prependIV);
  return encrypted;
};

const decryptStream = async (encryptedStream, key) => {
  const encryptedFilename = randomUUID({ disableEntropyCache: true });
  const encryptedFilePath = path.resolve(TEMP_PATH, encryptedFilename);

  try {
    // Stream cipher to file to read IV from the beginning.
    const streamToDisk = fs.createWriteStream(encryptedFilePath);
    streamToDisk.on("error", console.log);
    const streamFromIPFS = new Promise(resolve => void streamToDisk.on("finish", resolve));
    encryptedStream.pipe(streamToDisk);
    await streamFromIPFS;

    // Read and return IV.
    const getIVFromStream = fs.createReadStream(encryptedFilePath, { highWaterMark: 16 });

    const iv = await new Promise((resolve, reject) => {
      getIVFromStream.on("error", reject);
      getIVFromStream.on("readable", () => {
        const iv = getIVFromStream.read();
        getIVFromStream.destroy();
        resolve(iv);
      });
    }).catch(console.log);

    // Decrypt remainder of the stream, skipping the IV.
    const decrypt = createDecipheriv("aes-256-cbc", Buffer.from(key), iv);
    const encryptedFileStream = fs.createReadStream(encryptedFilePath, { start: 16 });
    const decrypted = encryptedFileStream.pipe(decrypt);

    // Delete temp file.
    decrypted.on("finish", async () => await fs.promises.unlink(encryptedFilePath));
    return decrypted;
  } catch (error) {
    if (encryptedFilePath) fs.promises.unlink(encryptedFilePath).catch(console.log);
    console.log(error);
  }
};

export { encryptStream, decryptStream };
