import { deleteObjects, streamFromBucket, streamToBucket } from "@gridfire/shared";
import Release from "@gridfire/shared/models/Release";
import sseClient from "@gridfire/shared/sseController";
import { MessageType, MessageWorkerNotification } from "@gridfire/shared/types";
import assert from "node:assert/strict";
import fs from "node:fs";
import sharp from "sharp";

const { BUCKET_IMG } = process.env;
const fsPromises = fs.promises;

assert(BUCKET_IMG, "BUCKET_IMG env var not set.");

const deleteArtwork = async (releaseId: string) => {
  await Release.updateOne(
    { _id: releaseId },
    { "artwork.dateUpdated": Date.now(), "artwork.status": "deleting" }
  ).exec();

  await deleteObjects(BUCKET_IMG, releaseId);

  const updatedRelease = await Release.findByIdAndUpdate(releaseId, {
    "artwork.dateUpdated": Date.now(),
    "artwork.status": "pending",
    published: false
  }).exec();

  if (!updatedRelease) {
    throw new Error(`Release with ID ${releaseId} not found.`);
  }

  return updatedRelease.toJSON();
};

const getArtworkStream = async (releaseId: string) => streamFromBucket(BUCKET_IMG, releaseId);

const uploadArtwork = async ({
  filePath,
  releaseId,
  userId
}: {
  filePath: string;
  mimeType: string;
  releaseId: string;
  userId: string;
}) => {
  try {
    await Release.updateOne(
      { _id: releaseId },
      { "artwork.dateCreated": Date.now(), "artwork.status": "storing" }
    ).exec();

    const payload: Omit<MessageWorkerNotification, "userId"> = {
      message: "Optimising and storing artwork…",
      title: "Processing",
      type: MessageType.WorkerMessage
    };

    sseClient.send(userId, payload);

    // Todo: create a worker job for this.
    const file = fs.createReadStream(filePath);
    const sharpInstance = sharp();
    const original = sharpInstance.clone().webp({ lossless: true });
    const xxs = sharpInstance.clone().resize(320, 320).webp();
    const xs = sharpInstance.clone().resize(640, 640).webp();
    const sm = sharpInstance.clone().resize(960, 960).webp();
    const md = sharpInstance.clone().resize(1024, 1024).webp();
    const lg = sharpInstance.clone().resize(1440, 1440).webp();
    const xl = sharpInstance.clone().resize(1920, 1920).webp();
    const xxl = sharpInstance.clone().resize(2560, 2560).webp();
    const options = { mimeType: "image/webp" };
    file.pipe(sharpInstance);

    await Promise.all([
      streamToBucket(BUCKET_IMG, `${releaseId}/original.webp`, original, options),
      streamToBucket(BUCKET_IMG, `${releaseId}/320w.webp`, xxs, options),
      streamToBucket(BUCKET_IMG, `${releaseId}/640w.webp`, xs, options),
      streamToBucket(BUCKET_IMG, `${releaseId}/960w.webp`, sm, options),
      streamToBucket(BUCKET_IMG, `${releaseId}/1024w.webp`, md, options),
      streamToBucket(BUCKET_IMG, `${releaseId}/1440w.webp`, lg, options),
      streamToBucket(BUCKET_IMG, `${releaseId}/1920w.webp`, xl, options),
      streamToBucket(BUCKET_IMG, `${releaseId}/2560w.webp`, xxl, options)
    ]);

    await Release.updateOne(
      { _id: releaseId },
      { "artwork.dateUpdated": Date.now(), "artwork.status": "stored" }
    ).exec();

    sseClient.send(userId, { type: MessageType.ArtworkUploaded });
  } finally {
    fsPromises.unlink(filePath).catch(console.log);
  }
};

export { deleteArtwork, getArtworkStream, uploadArtwork };
