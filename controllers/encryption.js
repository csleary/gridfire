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
  try {
    // Stream cipher to file to read IV from the beginning.
    const encryptedFilename = randomUUID({ disableEntropyCache: true });
    const encryptedFilePath = path.resolve(TEMP_PATH, encryptedFilename);
    const streamToDisk = fs.createWriteStream(encryptedFilePath);
    streamToDisk.on("error", console.log);
    const streamFromIPFS = new Promise(resolve => void streamToDisk.on("finish", resolve));
    encryptedStream.pipe(streamToDisk);
    await streamFromIPFS;

    // Read and copy IV, return derypted stream from remainder of file.
    const encryptedFile = await fs.promises.readFile(encryptedFilePath);
    const iv = Buffer.alloc(16);
    encryptedFile.copy(iv, 0, 0, 16);
    const decrypt = createDecipheriv("aes-256-cbc", Buffer.from(key), iv);
    const encryptedFileStream = fs.createReadStream(encryptedFilePath, { start: 16 });
    const decrypted = encryptedFileStream.pipe(decrypt);
    decrypted.on("finish", async () => await fs.promises.unlink(encryptedFilePath));
    return decrypted;
  } catch (error) {
    console.log(error);
  }
};

export { encryptStream, decryptStream };
