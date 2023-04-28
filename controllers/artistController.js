import mongoose from "mongoose";
import slugify from "slugify";

const Activity = mongoose.model("Activity");
const Artist = mongoose.model("Artist");
const { ObjectId } = mongoose.Types;

const createArtist = async (artistName, userId, suffix = "") =>
  Artist.create(
    [
      {
        name: artistName,
        slug: slugify(`${artistName}${suffix}`, { lower: true }),
        user: userId
      }
    ],
    { fields: { _id: 1 }, lean: true, new: true }
  ).catch(error => {
    if (error.code === 11000 && error.keyPattern.slug === 1) {
      let newSuffix;

      if (!suffix) {
        newSuffix = "-1";
      } else {
        newSuffix = `-${Number.parseInt(suffix.split("-").pop()) + 1}`;
      }

      return createArtist(artistName, userId, newSuffix);
    }

    throw error;
  });

const getActivity = async userId => {
  const artists = await Artist.find({ user: userId }, "_id", { lean: true }).exec();
  const artistIds = artists.map(({ _id }) => ObjectId(_id));

  const activity = await Activity.aggregate([
    { $match: { artist: { $in: artistIds }, type: { $in: ["favourite", "follow", "sale"] } } },
    { $lookup: { from: "artists", localField: "artist", foreignField: "_id", as: "artist" } },
    {
      $lookup: {
        from: "editions",
        let: { editionId: "$editionId" },
        pipeline: [
          {
            $match: {
              $expr: { $and: [{ $eq: ["$editionId", "$$editionId"] }, { $eq: ["$status", "minted"] }] }
            }
          }
        ],
        as: "edition"
      }
    },
    { $lookup: { from: "releases", localField: "release", foreignField: "_id", as: "release" } },
    { $lookup: { from: "sales", localField: "sale", foreignField: "_id", as: "sale" } },
    { $lookup: { from: "users", localField: "user", foreignField: "_id", as: "user" } },
    {
      $addFields: {
        artist: { $first: "$artist" },
        edition: { $first: "$edition" },
        release: { $first: "$release" },
        sale: { $first: "$sale" },
        user: { $first: "$user" }
      }
    },
    {
      $project: {
        artistName: "$artist.name",
        createdAt: 1,
        editionDescription: "$edition.metadata.description",
        releaseTitle: "$release.releaseTitle",
        amountPaid: "$sale.paid",
        type: 1,
        account: "$user.account"
      }
    },
    { $sort: { createdAt: -1 } }
  ]).exec();

  return activity;
};

export { createArtist, getActivity };
