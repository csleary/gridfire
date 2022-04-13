import Release from "../models/Release.js";
import fs from "fs";
import sharp from "sharp";

const fsPromises = fs.promises;

const deleteArtwork = async ({ ipfs, releaseId }) => {
  const release = await Release.findByIdAndUpdate(
    releaseId,
    { "artwork.status": "deleting", "artwork.dateUpdated": Date.now() },
    { new: true }
  ).exec();

  const { artwork } = release;
  const { cid } = artwork;
  await ipfs.pin.rm(cid).catch(console.log);

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
      { "artwork.status": "storing", "artwork.dateCreated": Date.now() },
      { new: true }
    ).exec();

    const { artwork } = release;
    const { cid: prevCid } = artwork;
    if (prevCid) await ipfs.pin.rm(prevCid).catch(console.log);
    sse.send(userId, { message: "Optimising and storing artwork…", title: "Processing" });
    const file = fs.createReadStream(filePath);
    const optimisedImg = sharp().resize(1000, 1000).toFormat("jpeg");
    const artworkStream = file.pipe(optimisedImg);
    const res = await ipfs.add(artworkStream);
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
  } finally {
    fsPromises.unlink(filePath).catch(console.log);
  }
};

export { deleteArtwork, uploadArtwork };
