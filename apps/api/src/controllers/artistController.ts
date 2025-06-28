import Activity from "@gridfire/shared/models/Activity";
import Artist, { IArtist, ILink } from "@gridfire/shared/models/Artist";
import Follower from "@gridfire/shared/models/Follower";
import Release from "@gridfire/shared/models/Release";
import { Link } from "@gridfire/shared/types";
import { ObjectId, Types } from "mongoose";
import slugify from "./imports/slugify.js";

const addLink = async (_id: string, user: ObjectId): Promise<ILink> => {
  const artist = await Artist.findOne({ _id, user }, "links").exec();

  if (!artist) {
    throw new Error("Artist not found.");
  }

  const newLink = artist.links.create({ title: "", uri: "" });
  return newLink.toJSON();
};

const createArtist = async (artistName: string, userId: ObjectId, suffix: string = ""): Promise<any> =>
  Artist.create(
    [
      {
        name: artistName,
        slug: slugify(`${artistName}${suffix}`, { lower: true }),
        user: userId
      }
    ],
    { fields: { _id: 1 }, lean: true, new: true }
  ).catch((error: any) => {
    if (error.code === 11000 && error.keyPattern.slug === 1) {
      let newSuffix = "";

      if (!suffix) {
        newSuffix = "-1";
      } else {
        newSuffix = `-${Number.parseInt(suffix.split("-").pop() || "0") + 1}`;
      }

      return createArtist(artistName, userId, newSuffix);
    }

    throw error;
  });

const findIdBySlug = async (slug: string) => {
  const artist = await Artist.exists({ slug }).exec();
  return artist;
};

const followArtist = async (artistId: string, userId: ObjectId) => {
  await Follower.findOneAndUpdate(
    { follower: userId, following: artistId },
    { $setOnInsert: { follower: userId, following: artistId } },
    { upsert: true }
  ).exec();

  Activity.follow(artistId, userId.toString());
};

const getActivity = async (userId: ObjectId) => {
  const artists = await Artist.find({ user: userId }, "_id", { lean: true }).exec();
  const artistIds = artists.map(({ _id }) => new Types.ObjectId(_id));

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

const getFollowers = async (following: string, follower?: ObjectId) => {
  const [numFollowers, isFollowing] = await Promise.all([
    Follower.countDocuments({ following }).exec(),
    ...(follower ? [Follower.exists({ follower, following }).exec()] : [])
  ]);

  return { numFollowers, isFollowing: Boolean(isFollowing) };
};

const getUserArtists = async (userId: ObjectId): Promise<any[]> => {
  const artists = await Artist.find({ user: userId }, "-__v", { lean: true }).exec();
  return artists;
};

const unfollowArtist = async (following: string, follower: ObjectId) => {
  await Follower.findOneAndDelete({ follower, following }).exec();
};

interface UpdateArtistParams {
  artistId: string;
  name: string;
  slug: string;
  biography: string;
  links: Link[];
  userId: ObjectId;
}

const updateArtist = async ({
  artistId,
  name,
  slug,
  biography,
  links,
  userId
}: UpdateArtistParams): Promise<IArtist> => {
  // If slug string length is zero, set it to null to satisfy the unique index.
  const artist = await Artist.findOneAndUpdate(
    { _id: artistId, user: userId },
    {
      name,
      slug: slug && slug.length === 0 ? null : slugify(slug, { lower: true, strict: true }),
      biography,
      links: links.slice(0, 10)
    },
    { fields: { __v: 0 }, new: true, runValidators: true }
  ).lean();

  if (!artist) {
    throw new Error("Artist not found.");
  }

  // Update existing releases with the new artist name.
  await Release.updateMany({ artist: artistId, user: userId }, { artistName: name }).exec();
  return artist;
};

export {
  addLink,
  createArtist,
  findIdBySlug,
  followArtist,
  getActivity,
  getFollowers,
  getUserArtists,
  unfollowArtist,
  updateArtist
};
