import Release from "gridfire/models/Release.js";
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

  if (cid) {
    console.log(`Unpinning artwork with CID: ${cid}`);
    await ipfs.pin.rm(cid).catch(error => console.error(error.message));
  }

  const updatedRelease = await Release.findByIdAndUpdate(
    releaseId,
    {
      $unset: { "artwork.cid": 1 },
      $set: { "artwork.status": "pending", "artwork.dateUpdated": Date.now(), published: false }
    },
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

    if (prevCid) {
      console.log(`Unpinning existing artwork with CID: ${prevCid}`);
      await ipfs.pin.rm(prevCid).catch(error => console.error(error.message));
    }

    await release
      .updateOne({
        $unset: { "artwork.cid": 1 },
        $set: { "artwork.dateUpdated": Date.now(), "artwork.status": "pending" }
      })
      .exec();

    sse.send(userId, { message: "Optimising and storing artwork…", title: "Processing" });
    const file = fs.createReadStream(filePath);
    const optimisedImg = sharp().resize(1000, 1000).toFormat("jpeg");
    const artworkStream = file.pipe(optimisedImg);
    const res = await ipfs.add(artworkStream, { cidVersion: 1 });
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
    return cid;
  } finally {
    fsPromises.unlink(filePath).catch(console.log);
  }
};

export { deleteArtwork, uploadArtwork };
