import { getAddress } from "ethers";
import mongoose from "mongoose";

const { ObjectId } = mongoose.Types;
const Activity = mongoose.model("Activity");
const Artist = mongoose.model("Artist");
const User = mongoose.model("User");

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

const getUser = async userId => {
  const [user] = await User.aggregate([
    { $match: { _id: userId } },
    { $lookup: { from: "favourites", localField: "_id", foreignField: "user", as: "favourites" } },
    { $lookup: { from: "wish-lists", localField: "_id", foreignField: "user", as: "wishList" } },
    { $lookup: { from: "sales", localField: "_id", foreignField: "user", as: "purchases" } },
    { $project: { __v: 0, purchases: { __v: 0 } } }
  ]).exec();

  return user;
};

const setPaymentAddress = async ({ paymentAddress, userId }) => {
  return User.findByIdAndUpdate(userId, { paymentAddress: getAddress(paymentAddress) }).exec();
};

export { getActivity, getUser, setPaymentAddress };
