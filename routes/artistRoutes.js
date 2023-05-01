import {
  addLink,
  findIdBySlug,
  followArtist,
  getActivity,
  getFollowers,
  getUserArtists,
  unfollowArtist,
  updateArtist
} from "gridfire/controllers/artistController.js";
import express from "express";
import requireLogin from "gridfire/middlewares/requireLogin.js";

const router = express.Router();

router.get("/:artistId/followers", async (req, res) => {
  try {
    const { artistId } = req.params;
    const { _id: userId } = req.user || {};
    const { numFollowers, isFollowing } = await getFollowers(artistId, userId);
    res.json({ numFollowers, isFollowing });
  } catch (error) {
    console.error(error);
    res.sendStatus(400);
  }
});

router.get("/:slug/id", async (req, res) => {
  try {
    const { slug } = req.params;
    const artist = await findIdBySlug(slug);
    res.json(artist);
  } catch (error) {
    console.error(error);
    res.sendStatus(400);
  }
});

router.use(requireLogin);

router.get("/", async (req, res) => {
  try {
    const { _id: userId } = req.user;
    const artists = await getUserArtists(userId);
    res.send(artists);
  } catch (error) {
    console.error(error);
    res.sendStatus(400);
  }
});

router.post("/:artistId", async (req, res) => {
  try {
    const { name, slug, biography, links } = req.body;
    const { artistId } = req.params;
    const { _id: userId } = req.user;
    const artist = await updateArtist({ artistId, name, slug, biography, links, userId });
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

router.post("/:artistId/follow", async (req, res) => {
  try {
    const { _id: userId } = req.user;
    const { artistId } = req.params;
    await followArtist(artistId, userId);
    res.sendStatus(200);
  } catch (error) {
    console.error(error);
    res.sendStatus(400);
  }
});

router.delete("/:artistId/follow", async (req, res) => {
  try {
    const { _id: userId } = req.user;
    const { artistId } = req.params;
    await unfollowArtist(artistId, userId);
    res.sendStatus(200);
  } catch (error) {
    console.error(error);
    res.sendStatus(400);
  }
});

router.patch("/:artistId/link", async (req, res) => {
  try {
    const { _id: userId } = req.user;
    const { artistId } = req.params;
    const newLink = await addLink(artistId, userId);
    res.send(newLink);
  } catch (error) {
    console.error(error);
    res.sendStatus(400);
  }
});

router.get("/activity", async (req, res) => {
  const { _id: userId } = req.user;
  const activity = await getActivity(userId);
  res.json(activity);
});

export default router;
