import { deleteObject, streamFromBucket, streamToBucket } from "@gridfire/api/controllers/storage";
import Release from "@gridfire/shared/models/Release";
import sseClient from "@gridfire/shared/sseController";
import { MessageType } from "@gridfire/shared/types/messages";
import { ObjectId } from "mongoose";
import assert from "node:assert/strict";
import fs from "node:fs";
import sharp from "sharp";

const { BUCKET_IMG } = process.env;
const fsPromises = fs.promises;

assert(BUCKET_IMG, "BUCKET_IMG env var not set.");

const deleteArtwork = async (releaseId: string) => {
  await Release.findByIdAndUpdate(releaseId, {
    "artwork.dateUpdated": Date.now(),
    "artwork.status": "deleting"
  }).exec();

  await deleteObject(BUCKET_IMG, releaseId);

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
  releaseId: string;
  userId: ObjectId;
}) => {
  try {
    await Release.updateOne(
      { _id: releaseId },
      { "artwork.dateCreated": Date.now(), "artwork.status": "storing" }
    ).exec();

    sseClient.send(userId.toString(), {
      message: "Optimising and storing artwork…",
      title: "Processing",
      type: MessageType.WorkerMessage
    });

    const file = fs.createReadStream(filePath);
    const optimisedImg = sharp().resize(1000, 1000).webp();
    await streamToBucket(BUCKET_IMG, releaseId, file.pipe(optimisedImg));

    await Release.updateOne(
      { _id: releaseId },
      { "artwork.dateUpdated": Date.now(), "artwork.status": "stored" }
    ).exec();

    sseClient.send(userId.toString(), { type: MessageType.ArtworkUploaded });
  } finally {
    fsPromises.unlink(filePath).catch(console.log);
  }
};

export { deleteArtwork, getArtworkStream, uploadArtwork };
