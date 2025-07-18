import logger from "@gridfire/api/controllers/logger";
import Artist from "@gridfire/shared/models/Artist";
import Release from "@gridfire/shared/models/Release";
import { Router } from "express";
import mongoose from "mongoose";

const router = Router();

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
      return { ...prev, [mapKeyToModel[key as keyof typeof mapKeyToModel]]: value };
    }

    if (key === "year" && value)
      return {
        ...prev,
        [mapKeyToModel[key]]: {
          $gt: new Date(Date.UTC(Number.parseInt(value as string), 0)),
          $lte: new Date(Date.UTC(Number.parseInt(value as string) + 1, 0))
        }
      };

    return {
      ...prev,
      $or: [
        { artistName: { $options: "i", $regex: value } },
        { releaseTitle: { $options: "i", $regex: value } },
        { recordLabel: { $options: "i", $regex: value } },
        { tags: { $options: "i", $regex: value } },
        { "trackList.trackTitle": { $options: "i", $regex: value } },
        { catNumber: { $options: "i", $regex: value } },
        { info: { $options: "i", $regex: value } },
        { credits: { $options: "i", $regex: value } }
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
  const count = await Release.countDocuments();
  res.send({ count });
});

router.get("/:artistIdOrSlug", async (req, res) => {
  try {
    const { artistIdOrSlug } = req.params;
    const { isValidObjectId, Types } = mongoose;
    const { ObjectId } = Types;

    const [artistWorks] = await Artist.aggregate([
      { $match: isValidObjectId(artistIdOrSlug) ? { _id: new ObjectId(artistIdOrSlug) } : { slug: artistIdOrSlug } },
      {
        $lookup: {
          as: "releases",
          from: "releases",
          let: { artistId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $and: [{ $eq: ["$artist", "$$artistId"] }, { $eq: ["$published", true] }] }
              }
            },
            { $sort: { releaseDate: -1 } }
          ]
        }
      },
      {
        $project: {
          biography: 1,
          links: 1,
          name: 1,
          releases: 1,
          slug: 1
        }
      }
    ]).exec();

    if (!artistWorks) {
      return void res.sendStatus(404);
    }

    res.send(artistWorks);
  } catch (error) {
    logger.error(error);
    res.sendStatus(400);
  }
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
        limit: parseInt(catalogueLimit as string),
        skip: parseInt(catalogueSkip as string),
        sort: { [sortBy as string]: parseInt(sortOrder as string) }
      }
    );

    res.send(releases);
  } catch (error) {
    logger.error(error);
    res.status(400).json({ error: "Music catalogue could not be fetched." });
  }
});

export default router;
