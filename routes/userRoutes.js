import { getUser, setPaymentAddress } from "gridfire/controllers/userController.js";
import Favourite from "gridfire/models/Favourite.js";
import Release from "gridfire/models/Release.js";
import Sale from "gridfire/models/Sale.js";
import Wishlist from "gridfire/models/Wishlist.js";
import express from "express";
import requireLogin from "gridfire/middlewares/requireLogin.js";

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
    console.error(error);
    res.sendStatus(400);
  }
});

router.get("/collection", requireLogin, async (req, res) => {
  try {
    const collection = await Sale.find({ user: req.user._id }, "", { lean: true, sort: "-purchaseDate" })
      .populate({
        path: "release",
        model: Release,
        options: { lean: true },
        select: "artistName artwork releaseTitle trackList._id trackList.trackTitle"
      })
      .exec();

    res.send(collection);
  } catch (error) {
    console.error(error);
    res.sendStatus(400);
  }
});

router.get("/favourites", requireLogin, async (req, res) => {
  try {
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
  } catch (error) {
    console.error(error);
    res.sendStatus(400);
  }
});

router.post("/favourites/:releaseId", requireLogin, async (req, res) => {
  try {
    const { releaseId: release } = req.params;
    const user = req.user._id;
    const favourite = await Favourite.create({ release, dateAdded: Date.now(), user });
    res.send(favourite.toJSON());
  } catch (error) {
    console.error(error);
    res.sendStatus(400);
  }
});

router.delete("/favourites/:releaseId", requireLogin, async (req, res) => {
  try {
    const { releaseId: release } = req.params;
    const user = req.user._id;
    await Favourite.findOneAndDelete({ release, user });
    res.end();
  } catch (error) {
    console.error(error);
    res.sendStatus(400);
  }
});

router.get("/releases", requireLogin, async (req, res) => {
  try {
    const userId = req.user._id;

    const releases = await Release.aggregate([
      { $match: { user: userId } },
      { $lookup: { from: "favourites", localField: "_id", foreignField: "release", as: "favourites" } },
      { $lookup: { from: "plays", localField: "_id", foreignField: "release", as: "plays" } },
      { $lookup: { from: "sales", localField: "_id", foreignField: "release", as: "sales" } },
      {
        $project: {
          artist: 1,
          artistName: 1,
          artwork: { cid: 1, status: 1 },
          faves: { $size: "$favourites" },
          plays: { $size: "$plays" },
          price: 1,
          published: 1,
          releaseDate: 1,
          releaseTitle: 1,
          sales: { $size: "$sales" },
          trackList: { status: 1 }
        }
      },
      { $sort: { releaseDate: -1 } }
    ]).exec();

    res.send(releases);
  } catch (error) {
    console.error(error);
    res.sendStatus(400);
  }
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
  try {
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
  } catch (error) {
    console.error(error);
    res.sendStatus(400);
  }
});

router.post("/wishlist/:releaseId", requireLogin, async (req, res) => {
  try {
    const { note } = req.body;
    const { releaseId: release } = req.params;
    const user = req.user._id;

    const wishlistItem = await Wishlist.findOneAndUpdate(
      { release },
      { dateAdded: Date.now(), note, user },
      { new: true, upsert: true }
    );

    res.send(wishlistItem.toJSON());
  } catch (error) {
    console.error(error);
    res.sendStatus(400);
  }
});

router.delete("/wishlist/:releaseId", requireLogin, async (req, res) => {
  try {
    const { releaseId: release } = req.params;
    const user = req.user._id;
    await Wishlist.findOneAndDelete({ release, user });
    res.end();
  } catch (error) {
    console.error(error);
    res.sendStatus(400);
  }
});

export default router;
