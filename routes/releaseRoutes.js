import { createArtist } from "gridfire/controllers/artistController.js";
import { deleteArtwork } from "gridfire/controllers/artworkController.js";
import { deleteTrack } from "gridfire/controllers/trackController.js";
import express from "express";
import mongoose from "mongoose";
import requireLogin from "gridfire/middlewares/requireLogin.js";

const Activity = mongoose.model("Activity");
const Artist = mongoose.model("Artist");
const Favourite = mongoose.model("Favourite");
const Release = mongoose.model("Release");
const User = mongoose.model("User");
const WishList = mongoose.model("WishList");
const router = express.Router();

router.delete("/:releaseId", requireLogin, async (req, res) => {
  try {
    const user = req.user._id;
    const { releaseId } = req.params;
    const release = await Release.findOne({ _id: releaseId, user }, "artist artwork trackList").exec();
    const { artist, trackList } = release;

    // Delete from buckets.
    console.log(`[${releaseId}] Deleting release…`);
    console.log(`[${releaseId}] Deleting artwork…`);
    await deleteArtwork(releaseId);
    console.log(`[${releaseId}] Artwork deleted.`);
    console.log(`[${releaseId}] Deleting audio files…`);
    await Promise.all(trackList.map(({ _id: trackId }) => deleteTrack(trackId, user)));
    console.log(`[${releaseId}] Audio files deleted.`);

    // Delete from database.
    await Release.findOneAndRemove({ _id: releaseId, user }).exec();
    const artistHasOtherReleases = await Release.exists({ artist });
    let deleteArtist = Promise.resolve();
    if (!artistHasOtherReleases) deleteArtist = Artist.findOneAndRemove({ _id: artist, user }).exec();
    const deleteFromFavourites = Favourite.deleteMany({ release: releaseId }).exec();
    const deleteFromWishlists = WishList.deleteMany({ release: releaseId }).exec();
    await Promise.all([deleteArtist, deleteFromFavourites, deleteFromWishlists]);
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

    const release = await Release.findOne({
      _id: releaseId,
      $or: [{ published: true }, { published: false, user: { $eq: userId } }] // Allow artists to see their own unpublished release pages.
    }).exec();

    if (!release) {
      return void res.sendStatus(404);
    }

    res.json({ release });
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
    Activity.publish(release.artist.toString(), releaseId);
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
              "trackList.$.isBonus": isBonus,
              "trackList.$.isEditionOnly": isEditionOnly,
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
                  isBonus,
                  isEditionOnly,
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
    res.sendStatus(200);
  } catch (error) {
    console.error(error);
    res.sendStatus(400);
  }
});

export default router;
