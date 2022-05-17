import Artist from "../models/Artist.js";
import Favourite from "../models/Favourite.js";
import Release from "../models/Release.js";
import Sale from "../models/Sale.js";
import User from "../models/User.js";
import Wishlist from "../models/Wishlist.js";
import { createArtist } from "../controllers/artistController.js";
import { ethers, utils } from "ethers";
import express from "express";
import requireLogin from "../middlewares/requireLogin.js";

const { NETWORK_URL } = process.env;
const router = express.Router();

router.delete("/:releaseId", requireLogin, async (req, res) => {
  try {
    const { ipfs } = req.app.locals;
    const user = req.user._id;
    const { releaseId } = req.params;
    const release = await Release.findOne({ _id: releaseId, user }, "artist artwork trackList").exec();
    const { artist, artwork, trackList } = release;

    // Delete artwork from IPFS.
    console.log(`Unpinning artwork CID ${artwork.cid} for release ${releaseId}…`);
    const deleteArtwork = artwork.cid ? ipfs.pin.rm(artwork.cid).catch(console.log) : Promise.resolve();

    // Delete track audio and playlists from IPFS.
    const deleteTracks = trackList.reduce(
      (prev, track) => [
        ...prev,
        ...Object.values(track.cids).map(cid => {
          console.log(`Unpinning CID ${cid} for track ${track._id.toString()}…`);
          ipfs.pin.rm(cid).catch(console.log);
        })
      ],
      []
    );

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
    console.log(error);
    res.status(400).json({ error: error.message || error.toString() });
  }
});

router.get("/:releaseId", async (req, res) => {
  try {
    const { releaseId } = req.params;
    const release = await Release.findById(releaseId).exec();

    if (!release.published && !release.user.equals(req.user._id)) {
      throw new Error("This release is currently unavailable.");
    }

    res.json({ release: release.toJSON({ versionKey: false }) });
  } catch (error) {
    console.log(error);
    res.status(400).json({ error: error.message || error.toString() });
  }
});

router.get("/purchase/:releaseId", requireLogin, async (req, res) => {
  try {
    const buyer = req.user._id;
    const { releaseId } = req.params;
    const alreadyBought = await Sale.exists({ user: buyer, release: releaseId });
    if (alreadyBought) throw new Error("You already own this release.");
    const { price, user: userId } = await Release.findById(releaseId, "user price", { lean: true }).exec();
    const { account: paymentAddress } = await User.findById(userId, "account", { lean: true }).exec();
    res.json({ paymentAddress, price });
  } catch (error) {
    console.log(error);
    res.status(400).json({ error: error.message || error.toString() });
  }
});

router.post("/purchase/:releaseId", requireLogin, async (req, res) => {
  try {
    const user = req.user._id;
    const { releaseId } = req.params;
    const { transactionHash } = req.body;
    const release = await Release.findById(releaseId, "price", { lean: true }).exec();
    const provider = ethers.getDefaultProvider(NETWORK_URL);
    const transaction = await provider.getTransaction(transactionHash);
    const { data } = transaction;
    const abi = ["function purchase(address artistAddress, uint256 paidBytes, uint256 priceBytes)"];
    const purchaseInterface = new utils.Interface(abi);
    const decodedData = purchaseInterface.parseTransaction({ data });
    const { paidBytes } = decodedData.args;
    const paid = Number(utils.formatEther(paidBytes));
    const { price } = release;
    if (paid < price) return res.sendStatus(422); // Check calldata price was not less than release price.
    const transactionReceipt = await provider.waitForTransaction(transactionHash);
    const { from: buyer, status } = transactionReceipt;

    if (status === 1) {
      await Sale.create({
        purchaseDate: Date.now(),
        release: releaseId,
        paid,
        transaction,
        user,
        userAddress: buyer
      }).catch(error => {
        if (error.code === 11000) {
          console.log(error);
        }
      });
    }

    res.sendStatus(200);
  } catch (error) {
    console.log(error);
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
    res.json(updatedRelease.toJSON({ versionKey: false }));
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

    const release = await Release.findOneAndUpdate({ _id: releaseId, user }, update, {
      new: true,
      upsert: true
    }).exec();

    const newTracks = [];
    trackList.forEach((update, index) => {
      const existing = release.trackList.id(update._id);

      if (existing) {
        existing.trackTitle = update.trackTitle;
        const prevIndex = release.trackList.findIndex(el => el._id.equals(update._id));

        if (prevIndex !== index) {
          // Track has since been moved.
          const [trackFrom] = release.trackList.splice(prevIndex, 1);
          if (trackFrom) release.trackList.splice(index, 0, trackFrom);
        }
      } else {
        // Add new tracks to be inserted afterwards.
        newTracks.push([update, index]);
      }
    });

    await release.save();

    // Insert new tracks
    for (const [update, index] of newTracks) {
      await release.updateOne({ $push: { trackList: { $each: [update], $position: index } } }).exec();
    }

    const updated = await Release.findOne({ _id: releaseId, user }).exec();
    res.json(updated.toJSON());
  } catch (error) {
    console.log(error);
    res.status(400).json({ error: error.message || error.toString() });
  }
});

export default router;
