import Edition from "@gridfire/shared/models/Edition.js";
import { IRelease } from "@gridfire/shared/models/Release.js";
import mongoose from "mongoose";

const { Release } = mongoose.models;

const updateEditionStatus = async (releaseId: string, editionObjectId: string, editionId: string) => {
  const filter = { _id: editionObjectId, release: releaseId };
  const update = { editionId, status: "minted" };
  const options = { new: true, lean: true };
  const populateOptions = { path: "release", model: Release, options: { lean: true }, select: "user artist" };

  const edition = await Edition.findOneAndUpdate(filter, update, options)
    .populate<{ release: IRelease }>(populateOptions)
    .exec();
  return edition;
};

export { updateEditionStatus };
