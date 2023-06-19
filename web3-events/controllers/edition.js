import mongoose from "mongoose";

const { Edition, Release } = mongoose.models;

const updateEditionStatus = async (releaseId, editionId) => {
  const filter = { _id: editionId, release: releaseId };
  const update = { editionId: editionId.toString(), status: "minted" };
  const options = { new: true, lean: true };
  const populateOptions = { path: "release", model: Release, options: { lean: true }, select: "user" };
  const edition = await Edition.findOneAndUpdate(filter, update, options).populate(populateOptions).exec();
  return edition;
};

export { updateEditionStatus };
