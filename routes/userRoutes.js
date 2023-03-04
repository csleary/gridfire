import { getUser, setPaymentAddress } from "gridfire/controllers/userController.js";
import Favourite from "gridfire/models/Favourite.js";
import Release from "gridfire/models/Release.js";
import Sale from "gridfire/models/Sale.js";
import WishList from "gridfire/models/WishList.js";
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
  const [albums, singles] = await Promise.all([
    // Get full-releases.
    Sale.find({ type: { $ne: "single" }, user: req.user._id }, "paid purchaseDate transaction.transactionHash type", {
      lean: true,
      sort: "-purchaseDate"
    })
      .populate({
        path: "release",
        model: Release,
        options: { lean: true },
        select: "artistName artwork releaseTitle trackList._id trackList.trackTitle"
      })
      .exec(),

    // Get singles.
    Sale.aggregate([
      { $match: { type: "single", user: req.user._id } },
      { $addFields: { trackId: "$release" } },
      {
        $lookup: {
          from: "releases",
          localField: "release",
          foreignField: "trackList._id",
          as: "release"
        }
      },
      { $unwind: { path: "$release", preserveNullAndEmptyArrays: true } },
      { $sort: { purchaseDate: -1 } },
      {
        $project: {
          paid: 1,
          purchaseDate: 1,
          release: {
            _id: 1,
            artistName: 1,
            artwork: 1,
            releaseTitle: 1,
            "trackList._id": 1,
            "trackList.trackTitle": 1
          },
          trackId: 1,
          "transaction.transactionHash": 1,
          type: 1
        }
      }
    ]).exec()
  ]);

  res.send({ albums, singles });
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

    const favourite = await Favourite.findOneAndUpdate(
      { release },
      { dateAdded: Date.now(), user },
      { new: true, upsert: true }
    )
      .populate({
        path: "release",
        match: { published: true },
        model: Release,
        options: { lean: true },
        select: "artistName artwork releaseTitle trackList._id trackList.trackTitle"
      })
      .exec();

    res.json(favourite);
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
      {
        $lookup: {
          from: "plays",
          let: { releaseId: "$_id", userId: "$user" },
          pipeline: [
            { $match: { $expr: { $and: [{ $eq: ["$release", "$$releaseId"] }, { $ne: ["$user", "$$userId"] }] } } }
          ],
          as: "plays"
        }
      },
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

router.get("/wishlist", requireLogin, async (req, res) => {
  try {
    const userWishList = await WishList.find({ user: req.user._id }, "", { lean: true, sort: "-release.releaseDate" })
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

    const wishListItem = await WishList.findOneAndUpdate(
      { release },
      { dateAdded: Date.now(), note, user },
      { new: true, upsert: true }
    )
      .populate({
        path: "release",
        match: { published: true },
        model: Release,
        options: { lean: true },
        select: "artistName artwork releaseTitle trackList._id trackList.trackTitle"
      })
      .exec();

    res.json(wishListItem);
  } catch (error) {
    console.error(error);
    res.sendStatus(400);
  }
});

router.delete("/wishlist/:releaseId", requireLogin, async (req, res) => {
  try {
    const { releaseId: release } = req.params;
    const user = req.user._id;
    await WishList.findOneAndDelete({ release, user });
    res.end();
  } catch (error) {
    console.error(error);
    res.sendStatus(400);
  }
});

export default router;
