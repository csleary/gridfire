import Release from "../models/Release.js";
import fs from "fs";
import sharp from "sharp";
import { CID } from "ipfs-http-client";

const fsPromises = fs.promises;

const deleteArtwork = async ({ ipfs, release }) => {
  const releaseId = release._id.toString();
  release.updateOne({ $set: { "artwork.status": "deleting", "artwork.dateUpdated": Date.now() } }).exec();
  const { artwork } = release;
  const { cid } = artwork;

  await ipfs.pin.rm(cid).catch(error => {
    console.log(error);
  });

  const updatedRelease = await Release.findByIdAndUpdate(
    releaseId,
    { $set: { "artwork.status": "deleted", "artwork.dateUpdated": Date.now(), published: false } },
    { new: true }
  ).exec();

  return updatedRelease.toJSON();
};

const uploadArtwork = async ({ filePath, ipfs, releaseId, userId, sse }) => {
  try {
    const release = await Release.findByIdAndUpdate(
      releaseId,
      { $set: { "artwork.status": "storing", "artwork.dateCreated": Date.now() } },
      { new: true }
    ).exec();

    sse.send(userId, { message: "Optimising and storing artwork…", title: "Processing" });
    const file = fs.createReadStream(filePath);
    const optimisedImg = sharp().resize(1000, 1000).toFormat("jpeg");
    const content = file.pipe(optimisedImg);
    const res = await ipfs.add({ content }, { progress: progress => console.log(progress) });
    const { cid } = res;

    await release
      .updateOne({
        $set: {
          "artwork.cid": cid.toString(),
          "artwork.dateUpdated": Date.now(),
          "artwork.status": "stored"
        }
      })
      .exec();

    sse.send(userId, { type: "artworkUploaded" });
    await fsPromises.unlink(filePath);
  } catch (error) {
    await fsPromises.unlink(filePath).catch(() => {});
    throw error;
  }
};

export { deleteArtwork, uploadArtwork };
