import { getUser, setPaymentAddress } from "../controllers/userController.js";
import Favourite from "../models/Favourite.js";
import Release from "../models/Release.js";
import Sale from "../models/Sale.js";
import Wishlist from "../models/Wishlist.js";
import express from "express";
import requireLogin from "../middlewares/requireLogin.js";

const router = express.Router();

router.get("/", async (req, res) => {
  if (!req.user) return res.end();
  const user = await getUser(req.user._id);
  res.send(user);
});

router.post("/address", requireLogin, async (req, res) => {
  try {
    const { paymentAddress } = req.body;
    const userId = req.user._id.toString();
    await setPaymentAddress({ paymentAddress, userId });
    res.json({ paymentAddress });
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
});

router.get("/collection/", requireLogin, async (req, res) => {
  const collection = await Sale.find({ user: req.user._id }, "", { lean: true, sort: "-purchaseDate" })
    .populate({
      path: "release",
      model: Release,
      options: { lean: true },
      select: "artistName artwork releaseTitle trackList._id trackList.trackTitle"
    })
    .exec();

  res.send(collection);
});

router.get("/favourites/", requireLogin, async (req, res) => {
  const userFavourites = await Favourite.find({ user: req.user._id }, "", {
    lean: true,
    sort: "-release.releaseDate"
  })
    .populate({
      path: "release",
      match: { published: true },
      model: Release,
      options: { lean: true },
      select: "artistName artwork releaseTitle trackList._id trackList.trackTitle"
    })
    .exec();

  res.send(userFavourites);
});

router.post("/favourites/:releaseId", requireLogin, async (req, res) => {
  const { releaseId: release } = req.params;
  const user = req.user._id;
  const favourite = await Favourite.create({ release, dateAdded: Date.now(), user });
  res.send(favourite.toJSON());
});

router.delete("/favourites/:releaseId", requireLogin, async (req, res) => {
  const { releaseId: release } = req.params;
  const user = req.user._id;
  await Favourite.findOneAndDelete({ release, user });
  res.end();
});

router.get("/plays", requireLogin, async (req, res) => {
  try {
    const userId = req.user._id;

    const releases = await Release.aggregate([
      { $match: { user: userId } },
      { $lookup: { from: "plays", localField: "_id", foreignField: "release", as: "plays" } },
      { $project: { total: { $size: "$plays" } } }
    ]).exec();

    res.send(releases);
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
});

router.get("/release/:releaseId", requireLogin, async (req, res) => {
  const release = await Release.findById(req.params.releaseId, "-__v", { lean: true }).exec();
  res.send(release);
});

router.get("/releases/", requireLogin, async (req, res) => {
  const releases = await Release.find({ user: req.user._id }, "-__v", { lean: true, sort: "-releaseDate" }).exec();
  res.send(releases);
});

router.get("/releases/favourites", requireLogin, async (req, res) => {
  try {
    const userId = req.user._id;

    const releases = await Release.aggregate([
      { $match: { user: userId } },
      { $lookup: { from: "favourites", localField: "_id", foreignField: "release", as: "favourites" } },
      { $project: { total: { $size: "$favourites" } } }
    ]).exec();

    res.send(releases);
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
});

router.get("/sales", requireLogin, async (req, res) => {
  const releases = await Release.find({ user: req.user._id });

  const sales = await Sale.aggregate([
    { $match: { release: { $in: releases.map(({ _id }) => _id) } } },
    { $group: { _id: "$release", sum: { $sum: 1 } } },
    { $sort: { sum: -1 } }
  ]).exec();

  res.send(sales);
});

router.post("/transactions", requireLogin, async (req, res) => {
  try {
    const { releaseId, paymentHash } = req.body;
    const { price } = req.session;
    const transations = await getUserTransactions({ user: req.user, releaseId, paymentHash, price });
    res.send(transations);
  } catch (error) {
    if (error.data) return res.status(400).send({ error: error.data.message });
    res.status(400).send({ error: error.message });
  }
});

router.get("/wishlist", requireLogin, async (req, res) => {
  const userWishList = await Wishlist.find({ user: req.user._id }, "", { lean: true, sort: "-release.releaseDate" })
    .populate({
      path: "release",
      match: { published: true },
      model: Release,
      options: { lean: true },
      select: "artistName artwork releaseTitle trackList._id trackList.trackTitle"
    })
    .exec();

  res.send(userWishList);
});

router.post("/wishlist/:releaseId", requireLogin, async (req, res) => {
  const { note } = req.body;
  const { releaseId: release } = req.params;
  const user = req.user._id;

  const wishlistItem = await Wishlist.findOneAndUpdate(
    { release },
    { dateAdded: Date.now(), note, user },
    { new: true, upsert: true }
  );

  res.send(wishlistItem.toJSON());
});

router.delete("/wishlist/:releaseId", requireLogin, async (req, res) => {
  const { releaseId: release } = req.params;
  const user = req.user._id;
  await Wishlist.findOneAndDelete({ release, user });
  res.end();
});

export default router;
