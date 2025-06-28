import logger from "@gridfire/api/controllers/logger";
import { getUser, setPaymentAddress } from "@gridfire/api/controllers/userController";
import requireLogin from "@gridfire/api/middlewares/requireLogin";
import Activity from "@gridfire/shared/models/Activity";
import Favourite from "@gridfire/shared/models/Favourite";
import Release, { IRelease } from "@gridfire/shared/models/Release";
import Sale from "@gridfire/shared/models/Sale";
import type { IUser } from "@gridfire/shared/models/User";
import WishList from "@gridfire/shared/models/WishList";
import { Router } from "express";

const router = Router();

router.get("/", async (req, res) => {
  if (!req.user) return void res.end();
  const user = await getUser(req.user._id);
  res.send(user);
});

router.post("/address", requireLogin, async (req, res) => {
  try {
    const { paymentAddress } = req.body;
    const { _id: userId } = req.user as IUser;
    const updatedAddress = await setPaymentAddress({ paymentAddress, userId });
    res.send(updatedAddress);
  } catch (error) {
    logger.error(error);
    res.sendStatus(400);
  }
});

router.get("/albums", requireLogin, async (req, res) => {
  const { _id: userId } = req.user as IUser;

  const albums = await Sale.find({ type: "album", user: userId }, "paid purchaseDate transactionHash type", {
    lean: true,
    sort: "-purchaseDate"
  })
    .populate({
      path: "release",
      model: Release,
      options: { lean: true },
      select: "artistName artwork releaseTitle trackList._id trackList.trackTitle"
    })
    .exec();

  res.send(albums);
});

router.get("/singles", requireLogin, async (req, res) => {
  const { _id: userId } = req.user as IUser;

  const singles = await Sale.aggregate([
    { $match: { type: "single", user: userId } },
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
        transactionHash: 1,
        type: 1
      }
    }
  ]).exec();

  res.send(singles);
});

router.get("/favourites", requireLogin, async (req, res) => {
  try {
    const { _id: userId } = req.user as IUser;

    const userFavourites = await Favourite.find({ user: userId }, "", {
      lean: true,
      sort: "-release.releaseDate"
    })
      .populate<{ release: IRelease }>({
        path: "release",
        match: { published: true },
        model: Release,
        options: { lean: true },
        select: "artistName artwork releaseTitle trackList._id trackList.trackTitle"
      })
      .exec();

    res.send(userFavourites);
  } catch (error) {
    logger.error(error);
    res.sendStatus(400);
  }
});

router.post("/favourites/:releaseId", requireLogin, async (req, res) => {
  try {
    const { releaseId: release } = req.params;
    const { _id: user } = req.user as IUser;

    const favourite = await Favourite.findOneAndUpdate(
      { release },
      { dateAdded: Date.now(), user },
      { new: true, upsert: true }
    )
      .populate<{ release: IRelease }>({
        path: "release",
        match: { published: true },
        model: Release,
        select: "artist artistName artwork releaseTitle trackList._id trackList.trackTitle"
      })
      .lean();

    Activity.favourite(favourite.release.artist.toString(), release, user.toString());
    res.json(favourite);
  } catch (error) {
    logger.error(error);
    res.sendStatus(400);
  }
});

router.delete("/favourites/:releaseId", requireLogin, async (req, res) => {
  try {
    const { releaseId: release } = req.params;
    const { _id: user } = req.user as IUser;
    await Favourite.deleteOne({ release, user }).exec();
    res.end();
  } catch (error) {
    logger.error(error);
    res.sendStatus(400);
  }
});

router.get("/releases", requireLogin, async (req, res) => {
  try {
    const { _id: user } = req.user as IUser;

    const releases = await Release.aggregate([
      { $match: { user } },
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
    logger.error(error);
    res.sendStatus(400);
  }
});

router.get("/wishlist", requireLogin, async (req, res) => {
  try {
    const { _id: user } = req.user as IUser;

    const userWishList = await WishList.find({ user }, "", { lean: true, sort: "-release.releaseDate" })
      .populate<{ release: IRelease }>({
        path: "release",
        match: { published: true },
        model: Release,
        select: "artistName artwork releaseTitle trackList._id trackList.trackTitle"
      })
      .lean();

    res.send(userWishList);
  } catch (error) {
    logger.error(error);
    res.sendStatus(400);
  }
});

router.post("/wishlist/:releaseId", requireLogin, async (req, res) => {
  try {
    const { note } = req.body;
    const { releaseId: release } = req.params;
    const { _id: user } = req.user as IUser;

    const wishListItem = await WishList.findOneAndUpdate(
      { release },
      { dateAdded: Date.now(), note, user },
      { new: true, upsert: true }
    )
      .populate<{ release: IRelease }>({
        path: "release",
        match: { published: true },
        model: Release,
        select: "artistName artwork releaseTitle trackList._id trackList.trackTitle"
      })
      .lean();

    res.json(wishListItem);
  } catch (error) {
    logger.error(error);
    res.sendStatus(400);
  }
});

router.delete("/wishlist/:releaseId", requireLogin, async (req, res) => {
  try {
    const { releaseId: release } = req.params;
    const { _id: user } = req.user as IUser;
    await WishList.deleteOne({ release, user }).exec();
    res.end();
  } catch (error) {
    logger.error(error);
    res.sendStatus(400);
  }
});

export default router;
