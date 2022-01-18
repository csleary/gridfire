import Artist from "../models/Artist.js";
import Favourite from "../models/Favourite.js";
import Release from "../models/Release.js";
import Sale from "../models/Sale.js";
import User from "../models/User.js";
import Wishlist from "../models/Wishlist.js";
import aws from "aws-sdk";
import { createArtist } from "../controllers/artistController.js";
import { ethers } from "ethers";
import express from "express";
import requireLogin from "../middlewares/requireLogin.js";

const { AWS_REGION, BUCKET_IMG, BUCKET_OPT, BUCKET_SRC, NETWORK_URL } = process.env;
aws.config.update({ region: AWS_REGION });
const router = express.Router();

router.delete("/:releaseId", requireLogin, async (req, res) => {
  try {
    const { releaseId } = req.params;
    const user = req.user._id;

    // Delete from db
    const { artist } = await Release.findOne({ _id: releaseId, user }, "artist").exec();
    const deleteRelease = await Release.findOneAndRemove({ _id: releaseId, user }).exec();
    const artistHasReleases = await Release.exists({ artist });
    let deleteArtist;
    if (!artistHasReleases) deleteArtist = Artist.findOneAndRemove({ _id: artist, user }).exec();

    // Delete audio from S3
    const s3 = new aws.S3();

    // Delete source audio
    const listSrcParams = { Bucket: BUCKET_SRC, Prefix: `${releaseId}` };
    const s3SrcData = await s3.listObjectsV2(listSrcParams).promise();

    let deleteS3Src;
    if (s3SrcData.Contents.length) {
      const deleteSrcParams = {
        Bucket: BUCKET_SRC,
        Delete: { Objects: s3SrcData.Contents.map(({ Key }) => ({ Key })) }
      };

      deleteS3Src = s3.deleteObjects(deleteSrcParams).promise();
    }

    // Delete streaming audio
    const listOptParams = { Bucket: BUCKET_OPT, Prefix: `mp4/${releaseId}` };
    const s3OptData = await s3.listObjectsV2(listOptParams).promise();

    let deleteS3Opt;
    if (s3OptData.Contents.length) {
      const deleteOptParams = {
        Bucket: BUCKET_OPT,
        Delete: { Objects: s3OptData.Contents.map(({ Key }) => ({ Key })) }
      };

      deleteS3Opt = s3.deleteObjects(deleteOptParams).promise();
    }

    // Delete art from S3
    const listImgParams = { Bucket: BUCKET_IMG, Prefix: `${releaseId}` };
    const s3ImgData = await s3.listObjectsV2(listImgParams).promise();

    let deleteS3Img;
    if (s3ImgData.Contents.length) {
      const deleteImgParams = { Bucket: BUCKET_IMG, Key: s3ImgData.Contents[0].Key };
      deleteS3Img = s3.deleteObject(deleteImgParams).promise();
    }

    const deleteFromFavourites = Favourite.deleteMany({ release: releaseId }).exec();
    const deleteFromWishlists = Wishlist.deleteMany({ release: releaseId }).exec();

    const [{ _id }] = await Promise.all([
      deleteRelease,
      deleteArtist,
      deleteFromFavourites,
      deleteFromWishlists,
      deleteS3Src,
      deleteS3Opt,
      deleteS3Img
    ]);
    res.send(_id);
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

    res.json({ release: release.toJSON() });
  } catch (error) {
    console.log(error);
    res.status(400).json({ error: error.message || error.toString() });
  }
});

router.get("/purchase/:releaseId", requireLogin, async (req, res) => {
  try {
    const { releaseId } = req.params;
    const alreadyBought = await Sale.exists({ user: req.user._id, release: releaseId });
    if (alreadyBought) throw new Error("You already own this release.");
    const release = await Release.findById(releaseId, "-__v", { lean: true });
    const owner = await User.findById(release.user, "auth.account", { lean: true });
    const paymentAddress = owner.auth.account;
    res.json({ release, paymentAddress });
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
    const release = await Release.findById(releaseId, "price", { lean: true });
    const provider = ethers.getDefaultProvider(NETWORK_URL);
    const transaction = await provider.waitForTransaction(transactionHash);
    const { from: buyer, confirmations } = transaction;

    if (confirmations > 0) {
      await Sale.create({
        purchaseDate: Date.now(),
        release: releaseId,
        paid: release.price,
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
    res.json(updatedRelease.toJSON());
  } catch (error) {
    console.log(error);
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
