import slugify from "@gridfire/api/controllers/slugify";
import Activity from "@gridfire/shared/models/Activity";
import Artist, { IArtist, ILink } from "@gridfire/shared/models/Artist";
import Follower from "@gridfire/shared/models/Follower";
import Release from "@gridfire/shared/models/Release";
import { Link } from "@gridfire/shared/types";
import { ObjectId, Types } from "mongoose";

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
    { $lookup: { as: "artist", foreignField: "_id", from: "artists", localField: "artist" } },
    {
      $lookup: {
        as: "edition",
        from: "editions",
        let: { editionId: "$editionId" },
        pipeline: [
          {
            $match: {
              $expr: { $and: [{ $eq: ["$editionId", "$$editionId"] }, { $eq: ["$status", "minted"] }] }
            }
          }
        ]
      }
    },
    { $lookup: { as: "release", foreignField: "_id", from: "releases", localField: "release" } },
    { $lookup: { as: "sale", foreignField: "_id", from: "sales", localField: "sale" } },
    { $lookup: { as: "user", foreignField: "_id", from: "users", localField: "user" } },
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
        account: "$user.account",
        amountPaid: "$sale.paid",
        artistName: "$artist.name",
        createdAt: 1,
        editionDescription: "$edition.metadata.description",
        releaseTitle: "$release.releaseTitle",
        type: 1
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

  return { isFollowing: Boolean(isFollowing), numFollowers };
};

const getUserArtists = async (userId: ObjectId): Promise<any[]> => {
  const artists = await Artist.find({ user: userId }, "-__v", { lean: true }).exec();
  return artists;
};

const unfollowArtist = async (following: string, follower: ObjectId) => {
  await Follower.deleteOne({ follower, following }).exec();
};

interface UpdateArtistParams {
  artistId: string;
  biography: string;
  links: Link[];
  name: string;
  slug: string;
  userId: ObjectId;
}

const updateArtist = async ({
  artistId,
  biography,
  links,
  name,
  slug,
  userId
}: UpdateArtistParams): Promise<IArtist> => {
  // If slug string length is zero, set it to null to satisfy the unique index.
  const artist = await Artist.findOneAndUpdate(
    { _id: artistId, user: userId },
    {
      biography,
      links: links.slice(0, 10),
      name,
      slug: slug && slug.length === 0 ? null : slugify(slug, { lower: true, strict: true })
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
