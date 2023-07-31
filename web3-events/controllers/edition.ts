import { IEdition } from "gridfire-web3-events/models/Edition.js";
import { IRelease } from "gridfire-web3-events/models/Release.js";
import mongoose from "mongoose";

const { Edition, Release } = mongoose.models;

type PopulatedEdition = IEdition & {
  release: IRelease;
};

const updateEditionStatus = async (
  releaseId: string,
  editionObjectId: string,
  editionId: string
): Promise<PopulatedEdition> => {
  const filter = { _id: editionObjectId, release: releaseId };
  const update = { editionId, status: "minted" };
  const options = { new: true, lean: true };
  const populateOptions = { path: "release", model: Release, options: { lean: true }, select: "user artist" };
  const edition = await Edition.findOneAndUpdate(filter, update, options).populate(populateOptions).exec();
  return edition;
};

export { updateEditionStatus };
