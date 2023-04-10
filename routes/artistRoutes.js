import express from "express";
import mongoose from "mongoose";
import requireLogin from "gridfire/middlewares/requireLogin.js";
import slugify from "slugify";

const Artist = mongoose.model("Artist");
const Follower = mongoose.model("Follower");
const Release = mongoose.model("Release");
const router = express.Router();

router.get("/", requireLogin, async (req, res) => {
  try {
    const userId = req.user._id;
    const artists = await Artist.find({ user: userId }, "-__v", { lean: true }).exec();
    res.send(artists);
  } catch (error) {
    console.error(error);
    res.sendStatus(400);
  }
});

router.post("/:artistId", requireLogin, async (req, res) => {
  try {
    const userId = req.user._id;
    const { name, slug, biography, links } = req.body;

    // If slug string length is zero, set it to null to satisfy the unique index.
    const artist = await Artist.findOneAndUpdate(
      { _id: req.params.artistId, user: userId },
      {
        name,
        slug: slug && slug.length === 0 ? null : slugify(slug, { lower: true, strict: true }),
        biography,
        links: links.slice(0, 10)
      },
      { fields: { __v: 0 }, lean: true, new: true }
    ).exec();

    await Release.updateMany({ artist: req.params.artistId, user: userId }, { artistName: name }).exec();
    res.send(artist);
  } catch (error) {
    if (error.codeName === "DuplicateKey") {
      return res.send({
        error: "Save failed. This artist slug is already in use. Please try another.",
        name: "slug",
        value: "This slug is in use. Please try another."
      });
    }

    console.error(error);
    res.sendStatus(400);
  }
});

router.patch("/:artistId/link", requireLogin, async (req, res) => {
  try {
    const userId = req.user._id;
    const artist = await Artist.findOne({ _id: req.params.artistId, user: userId }, "links").exec();
    const newLink = artist.links.create();
    res.send(newLink);
  } catch (error) {
    console.error(error);
    res.sendStatus(400);
  }
});

router.get("/:slug/id", requireLogin, async (req, res) => {
  try {
    const { slug } = req.params;
    const artist = await Artist.exists({ slug }).exec();
    res.json(artist);
  } catch (error) {
    console.error(error);
    res.sendStatus(400);
  }
});

router.get("/:artistId/following", requireLogin, async (req, res) => {
  try {
    const userId = req.user._id;
    const { artistId } = req.params;
    const isFollowing = await Follower.exists({ follower: userId, following: artistId }).exec();
    res.json({ isFollowing: Boolean(isFollowing) });
  } catch (error) {
    console.error(error);
    res.sendStatus(400);
  }
});

router.post("/:artistId/follow", requireLogin, async (req, res) => {
  try {
    const userId = req.user._id;
    const { artistId } = req.params;

    await Follower.findOneAndUpdate(
      { follower: userId, following: artistId },
      { $setOnInsert: { follower: userId, following: artistId } },
      { upsert: true }
    ).exec();

    res.sendStatus(200);
  } catch (error) {
    console.error(error);
    res.sendStatus(400);
  }
});

router.delete("/:artistId/follow", requireLogin, async (req, res) => {
  try {
    const userId = req.user._id;
    const { artistId } = req.params;
    await Follower.findOneAndDelete({ follower: userId, following: artistId }).exec();
    res.sendStatus(200);
  } catch (error) {
    console.error(error);
    res.sendStatus(400);
  }
});

export default router;
