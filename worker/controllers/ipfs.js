/* eslint-disable indent */
import { decryptStream, encryptStream } from "gridfire-worker/controllers/encryption.js";
import { Readable } from "stream";
import fs from "fs";
import { ipfs } from "gridfire-worker/consumer/index.js";
import path from "path";
import { randomUUID } from "crypto";
import tar from "tar-stream";

const { TEMP_PATH } = process.env;

const handleStreamError =
  (...streams) =>
  error => {
    console.error(error);
    for (const stream of streams) stream.destory();
    throw error;
  };

const decryptToFilePathByCid = async (cid, key) => {
  const tarStream = Readable.from(ipfs.get(cid));
  const tarExtract = tar.extract();
  const tempFilename = randomUUID({ disableEntropyCache: true });
  const tempFilePath = path.resolve(TEMP_PATH, tempFilename);

  await new Promise((resolve, reject) => {
    tarExtract.on("entry", async (header, srcStream, next) => {
      try {
        const decryptedStream = await decryptStream(srcStream, key);
        srcStream.on("error", handleStreamError(srcStream, decryptedStream));
        decryptedStream.on("error", handleStreamError(srcStream, decryptedStream));
        const streamToDisk = fs.createWriteStream(tempFilePath);

        const streamFinished = new Promise((resolve, reject) => {
          streamToDisk.on("error", reject);
          streamToDisk.on("finish", resolve);
        });

        decryptedStream.pipe(streamToDisk);
        await streamFinished;
        next();
      } catch (error) {
        srcStream.destroy(error);
        throw error;
      }
    });

    tarExtract.on("finish", resolve);
    tarExtract.on("error", reject);
    tarStream.pipe(tarExtract);
  });

  return tempFilePath;
};

const transformIpfsStreamByCid = async (cid, key, ffmpegProcessStream) => {
  const tempFilename = randomUUID({ disableEntropyCache: true });
  const tempFilePath = path.resolve(TEMP_PATH, tempFilename);

  const outputCid = await new Promise((resolve, reject) => {
    const tarExtract = tar.extract();
    tarExtract.on("error", reject);

    tarExtract.on("entry", async (header, srcStream, next) => {
      try {
        const decryptedStream = await decryptStream(srcStream, key);
        await ffmpegProcessStream(decryptedStream, tempFilePath);
        next();
      } catch (error) {
        srcStream.destroy(error);
        throw error;
      }
    });

    tarExtract.on("finish", async () => {
      try {
        const readStream = fs.createReadStream(tempFilePath);
        const encryptedReadStream = encryptStream(readStream, key);
        const ipfsFile = await ipfs.add(encryptedReadStream, { cidVersion: 1 });
        resolve(ipfsFile.cid.toString());
      } catch (error) {
        console.error(error);
        throw error;
      } finally {
        console.log("Removing temp IPFS file:", tempFilePath);
        await fs.promises.unlink(tempFilePath);
      }
    });

    const tarStream = Readable.from(ipfs.get(cid));
    tarStream.pipe(tarExtract);
  });

  return outputCid;
};

export { decryptToFilePathByCid, transformIpfsStreamByCid };
