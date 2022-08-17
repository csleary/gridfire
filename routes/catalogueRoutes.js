import express from "express";
import mongoose from "mongoose";
import Artist from "gridfire/models/Artist.js";
import Release from "gridfire/models/Release.js";

const router = express.Router();

const mapKeyToModel = {
  artist: "artistName",
  cat: "catNumber",
  label: "recordLabel",
  price: "price",
  tag: "tags",
  title: "releaseTitle",
  track: "trackList.trackTitle",
  year: "releaseDate"
};

router.get("/search", async (req, res) => {
  const query = Object.entries(req.query).reduce((prev, [key, value]) => {
    if (["artist", "cat", "label", "price", "tag", "title", "track"].includes(key)) {
      return { ...prev, [mapKeyToModel[key]]: value };
    }

    if (key === "year")
      return {
        ...prev,
        [mapKeyToModel[key]]: {
          $gt: new Date().setFullYear(value - 1),
          $lte: new Date().setFullYear(value)
        }
      };

    return {
      ...prev,
      $or: [
        { artistName: { $regex: value, $options: "i" } },
        { releaseTitle: { $regex: value, $options: "i" } },
        { recordLabel: { $regex: value, $options: "i" } },
        { tags: { $regex: value, $options: "i" } },
        { "trackList.trackTitle": { $regex: value, $options: "i" } },
        { catNumber: { $regex: value, $options: "i" } },
        { info: { $regex: value, $options: "i" } },
        { credits: { $regex: value, $options: "i" } }
      ]
    };
  }, {});

  const results = await Release.find(
    { ...query, published: true },
    {
      artistName: 1,
      artwork: 1,
      catNumber: 1,
      info: 1,
      price: 1,
      recordLabel: 1,
      releaseTitle: 1,
      trackList: { _id: 1, trackTitle: 1 }
    },
    { lean: true, limit: 50 }
  ).exec();

  res.send(results);
});

router.get("/count", async (req, res) => {
  const count = await Release.count();
  res.send({ count });
});

router.get("/:artistIdOrSlug", async (req, res) => {
  const { artistIdOrSlug } = req.params;
  const { isValidObjectId, Types } = mongoose;
  const { ObjectId } = Types;

  const [catalogue] = await Artist.aggregate([
    { $match: isValidObjectId(artistIdOrSlug) ? { _id: ObjectId(artistIdOrSlug) } : { slug: artistIdOrSlug } },
    {
      $lookup: {
        from: "releases",
        let: { artistId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: { $and: [{ $eq: ["$artist", "$$artistId"] }, { $eq: ["$published", true] }] }
            }
          },
          { $sort: { releaseDate: -1 } }
        ],
        as: "releases"
      }
    },
    {
      $project: {
        name: 1,
        slug: 1,
        biography: 1,
        links: 1,
        releases: 1
      }
    }
  ]).exec();

  res.send(catalogue);
});

router.get("/", async (req, res) => {
  try {
    const { catalogueLimit, catalogueSkip, sortBy, sortOrder } = req.query;

    const releases = await Release.find(
      { published: true },
      `
      -__v
      -artwork.dateCreated
      -artwork.dateUpdated 
      -createdAt
      -updatedAt
      -trackList.flac
      -trackList.mp3
      -trackList.mp4
      -trackList.src
      -trackList.createdAt
      -trackList.updatedAt
      `,
      {
        limit: parseInt(catalogueLimit),
        skip: parseInt(catalogueSkip),
        sort: { [sortBy]: parseInt(sortOrder) }
      }
    );

    res.send(releases);
  } catch (error) {
    console.log(error);
    res.status(400).send({ error: "Music catalogue could not be fetched." });
  }
});

export default router;
