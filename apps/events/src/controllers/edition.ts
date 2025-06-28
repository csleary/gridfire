import Edition, { EditionStatus } from "@gridfire/shared/models/Edition";
import Release, { IRelease } from "@gridfire/shared/models/Release";

const updateEditionStatus = async (releaseId: string, editionObjectId: string, editionId: string) => {
  const filter = { _id: editionObjectId, release: releaseId };
  const update = { editionId, status: EditionStatus.Minted };
  const options = { new: true };
  const populateOptions = { path: "release", model: Release, options: {}, select: "user artist" };

  const edition = await Edition.findOneAndUpdate(filter, update, options)
    .populate<{ release: IRelease }>(populateOptions)
    .lean();
  return edition;
};

export { updateEditionStatus };
