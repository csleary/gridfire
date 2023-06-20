import mongoose from "mongoose";

const { Edition, Release } = mongoose.models;

const updateEditionStatus = async (releaseId: string, editionObjectId: string, editionId: string) => {
  const filter = { _id: editionObjectId, release: releaseId };
  const update = { editionId, status: "minted" };
  const options = { new: true, lean: true };
  const populateOptions = { path: "release", model: Release, options: { lean: true }, select: "user" };
  const edition = await Edition.findOneAndUpdate(filter, update, options).populate(populateOptions).exec();
  return edition;
};

export { updateEditionStatus };
