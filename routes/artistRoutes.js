import express from "express";
import mongoose from "mongoose";
import requireLogin from "gridfire/middlewares/requireLogin.js";
import slugify from "slugify";

const Artist = mongoose.model("Artist");
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

export default router;
