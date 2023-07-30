import "gridfire/models/Release.js";
import { ObjectId, model } from "mongoose";
import { deleteObject, streamFromBucket, streamToBucket } from "gridfire/controllers/storage.js";
import { MessageType } from "gridfire/types/messages/index.js";
import assert from "assert/strict";
import fs from "fs";
import sharp from "sharp";
import sseClient from "gridfire/controllers/sseController.js";

const { BUCKET_IMG } = process.env;
const Release = model("Release");
const fsPromises = fs.promises;

assert(BUCKET_IMG, "BUCKET_IMG env var not set.");

const deleteArtwork = async (releaseId: string) => {
  await Release.findByIdAndUpdate(releaseId, {
    "artwork.status": "deleting",
    "artwork.dateUpdated": Date.now()
  }).exec();

  await deleteObject(BUCKET_IMG, releaseId);

  const updatedRelease = await Release.findByIdAndUpdate(releaseId, {
    "artwork.status": "pending",
    "artwork.dateUpdated": Date.now(),
    published: false
  }).exec();

  return updatedRelease.toJSON();
};

const getArtworkStream = (releaseId: string) => streamFromBucket(BUCKET_IMG, releaseId);

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
    await Release.findByIdAndUpdate(releaseId, {
      "artwork.status": "storing",
      "artwork.dateCreated": Date.now()
    }).exec();

    sseClient.send(userId.toString(), {
      message: "Optimising and storing artwork…",
      title: "Processing",
      type: MessageType.WorkerMessage
    });

    const file = fs.createReadStream(filePath);
    const optimisedImg = sharp().resize(1000, 1000).webp();
    await streamToBucket(BUCKET_IMG, releaseId, file.pipe(optimisedImg));

    await Release.findByIdAndUpdate(releaseId, {
      "artwork.dateUpdated": Date.now(),
      "artwork.status": "stored"
    }).exec();

    sseClient.send(userId.toString(), { type: MessageType.ArtworkUploaded });
  } finally {
    fsPromises.unlink(filePath).catch(console.log);
  }
};

export { deleteArtwork, getArtworkStream, uploadArtwork };
