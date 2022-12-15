import Artist from "gridfire/models/Artist.js";
import Favourite from "gridfire/models/Favourite.js";
import Release from "gridfire/models/Release.js";
import User from "gridfire/models/User.js";
import Wishlist from "gridfire/models/Wishlist.js";
import { createArtist } from "gridfire/controllers/artistController.js";
import express from "express";
import mongoose from "mongoose";
import requireLogin from "gridfire/middlewares/requireLogin.js";

const router = express.Router();

router.delete("/:releaseId", requireLogin, async (req, res) => {
  try {
    const { ipfs } = req.app.locals;
    const user = req.user._id;
    const { releaseId } = req.params;
    const release = await Release.findOne({ _id: releaseId, user }, "artist artwork trackList").exec();
    const { artist, artwork, trackList } = release;

    let deleteArtwork = Promise.resolve();
    if (artwork.cid) {
      console.log(`Unpinning artwork CID ${artwork.cid} for release ${releaseId}…`);
      deleteArtwork = ipfs.pin.rm(artwork.cid).catch(error => console.error(error.message));
    }

    const deleteTracks = trackList.reduce(
      (prev, { _id: trackId, flac, mp3 }) => [
        ...prev,
        ...Object.entries({ flac, mp3 })
          .filter(([, cid]) => Boolean(cid))
          .map(([key, cid]) => {
            console.log(`[${trackId.toString()}] Unpinning CID '${key}': ${cid}…`);
            ipfs.pin.rm(cid).catch(error => console.error(error.message));
          })
      ],
      []
    );

    console.log(`[${releaseId}] Deleting IPFS stream files…`);
    ipfs.files.rm(`/${releaseId}`, { recursive: true, flush: true, cidVersion: 1 });

    // Delete from Mongo.
    const deleteRelease = await Release.findOneAndRemove({ _id: releaseId, user }).exec();
    const artistHasReleases = await Release.exists({ artist });
    let deleteArtist = Promise.resolve();
    if (!artistHasReleases) deleteArtist = Artist.findOneAndRemove({ _id: artist, user }).exec();
    const deleteFromFavourites = Favourite.deleteMany({ release: releaseId }).exec();
    const deleteFromWishlists = Wishlist.deleteMany({ release: releaseId }).exec();

    await Promise.all([
      deleteRelease,
      deleteArtwork,
      deleteArtist,
      ...deleteTracks,
      deleteFromFavourites,
      deleteFromWishlists
    ]);

    console.log(`Release ${releaseId} deleted.`);
    res.sendStatus(200);
  } catch (error) {
    console.error(error);
    res.sendStatus(400);
  }
});

router.get("/:releaseId", async (req, res) => {
  try {
    const { releaseId } = req.params;
    const userId = req.user?._id;

    const [release] = await Release.aggregate([
      {
        $match: {
          _id: mongoose.Types.ObjectId(releaseId),
          $or: [{ published: true }, ...(userId ? [{ published: false, user: { $eq: userId } }] : [])] // Allow artists to see their own unpublished release pages.
        }
      },
      {
        $project: {
          artist: 1,
          artistName: 1,
          artwork: 1,
          catNumber: 1,
          credits: 1,
          info: 1,
          price: 1,
          pubName: 1,
          recName: 1,
          recYear: 1,
          recordLabel: 1,
          releaseTitle: 1,
          releaseDate: 1,
          tags: 1,
          trackList: {
            $map: {
              input: "$trackList",
              as: "track",
              in: {
                _id: "$$track._id",
                duration: "$$track.duration",
                isBonus: "$$track.isBonus",
                isEditionOnly: "$$track.isEditionOnly",
                price: "$$track.price",
                trackTitle: "$$track.trackTitle",
                mp4: {
                  $cond: [{ $eq: ["$$track.isBonus", true] }, false, "$$track.mp4"]
                }
              }
            }
          }
        }
      }
    ]).exec();

    if (!release) {
      return void res.sendStatus(404);
    }

    res.json({ release });
  } catch (error) {
    console.error(error);
    res.sendStatus(400);
  }
});

router.get("/:releaseId/ipfs", requireLogin, async (req, res) => {
  try {
    const { releaseId } = req.params;
    const user = req.user._id;

    const release = await Release.findOne(
      { _id: releaseId, user },
      {
        artwork: 1,
        releaseTitle: 1,
        "trackList._id": 1,
        "trackList.flac": 1,
        "trackList.mp3": 1,
        "trackList.mp4": 1,
        "trackList.trackTitle": 1
      },
      { lean: true }
    ).exec();

    if (!release) return res.sendStatus(200);
    res.json(release);
  } catch (error) {
    console.error(error);
    res.sendStatus(400);
  }
});

router.get("/:releaseId/purchase", requireLogin, async (req, res) => {
  try {
    const { releaseId } = req.params;

    const {
      price,
      user: { paymentAddress }
    } = await Release.findById(releaseId, "price", { lean: true })
      .populate({ path: "user", model: User, options: { lean: true }, select: "paymentAddress" })
      .exec();

    res.json({ paymentAddress, price });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message || error.toString() });
  }
});

router.patch("/:releaseId", requireLogin, async (req, res) => {
  try {
    const { releaseId } = req.params;
    const user = req.user._id;
    const release = await Release.findOne({ _id: releaseId, user }).exec();
    if (!release) return res.sendStatus(403);

    if (release.artwork.status !== "stored") {
      await release.updateOne({ published: false }).exec();
      throw new Error("Please ensure the release has artwork uploaded before publishing.");
    }

    if (!release.trackList.length) {
      await release.updateOne({ published: false }).exec();
      throw new Error("Please add at least one track to the release, with audio and a title, before publishing.");
    }

    if (release.trackList.some(track => track.status !== "stored")) {
      await release.updateOne({ published: false }).exec();
      throw new Error("Please ensure that all tracks have audio uploaded before publishing.");
    }

    if (release.trackList.some(track => !track.trackTitle)) {
      await release.updateOne({ published: false }).exec();
      throw new Error("Please ensure that all tracks have titles set before publishing.");
    }

    release.published = !release.published;
    const updatedRelease = await release.save();
    res.json(updatedRelease.toJSON());
  } catch (error) {
    res.status(200).json({ error: error.message });
  }
});

router.post("/", requireLogin, async (req, res) => {
  try {
    const user = req.user._id;

    const {
      artist: existingArtistId,
      artistName,
      catNumber,
      credits,
      info,
      price,
      pubYear,
      pubName,
      recYear,
      recName,
      recordLabel,
      releaseDate,
      releaseId,
      releaseTitle,
      tags,
      trackList
    } = req.body;

    let artist;
    if (existingArtistId) {
      artist = await Artist.findOne({ _id: existingArtistId, user }, "name", { lean: true }).exec();
    } else {
      [artist] = await createArtist(artistName, user);
    }

    const update = {
      artist: artist._id,
      artistName: artist.name,
      catNumber,
      credits,
      info,
      price,
      recordLabel,
      releaseDate,
      releaseTitle,
      pubYear,
      pubName,
      recYear,
      recName,
      tags
    };

    const updateOps = [
      // Update release details.
      {
        updateOne: {
          filter: { _id: releaseId, user },
          update,
          upsert: true
        }
      },
      ...trackList.flatMap(({ _id: trackId, isBonus, isEditionOnly, price: trackPrice, trackTitle }, index) => [
        // Update existing tracks.
        {
          updateOne: {
            filter: { _id: releaseId, "trackList._id": trackId, user },
            update: {
              ...(isBonus ? { "trackList.$.isBonus": isBonus } : {}),
              ...(isEditionOnly ? { "trackList.$.isEditionOnly": isEditionOnly } : {}),
              "trackList.$.price": trackPrice,
              "trackList.$.trackTitle": trackTitle,
              "trackList.$.position": index + 1
            }
          }
        },
        // Add new tracks.
        {
          updateOne: {
            filter: { _id: releaseId, trackList: { $not: { $elemMatch: { _id: trackId } } }, user },
            update: {
              $push: {
                trackList: {
                  _id: trackId,
                  ...(isBonus ? { isBonus } : {}),
                  ...(isEditionOnly ? { isEditionOnly } : {}),
                  position: index + 1,
                  price: trackPrice,
                  trackTitle
                }
              }
            }
          }
        }
      ]),
      // Sort the tracks array according to the new positions.
      {
        updateOne: {
          filter: { _id: releaseId, user },
          update: { $push: { trackList: { $each: [], $sort: { position: 1 } } } }
        }
      }
    ];

    await Release.bulkWrite(updateOps, { ordered: true });
    const updated = await Release.findOne({ _id: releaseId, user });
    res.json(updated.toJSON());
  } catch (error) {
    console.error(error);
    res.sendStatus(400);
  }
});

export default router;
