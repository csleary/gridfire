import {
  addLink,
  findIdBySlug,
  followArtist,
  getActivity,
  getFollowers,
  getUserArtists,
  unfollowArtist,
  updateArtist
} from "@gridfire/api/controllers/artistController";
import logger from "@gridfire/api/controllers/logger";
import requireLogin from "@gridfire/api/middlewares/requireLogin";
import type { IArtist } from "@gridfire/shared/models/Artist";
import type { IUser } from "@gridfire/shared/models/User";
import { Router } from "express";
import { Error } from "mongoose";

const router = Router();

router.get("/:artistId/followers", async (req, res) => {
  try {
    const { artistId } = req.params;
    const { _id: userId } = req.user || {};
    const { numFollowers, isFollowing } = await getFollowers(artistId, userId);
    res.json({ numFollowers, isFollowing });
  } catch (error) {
    logger.error(error);
    res.sendStatus(400);
  }
});

router.get("/:slug/id", async (req, res) => {
  try {
    const { slug } = req.params;
    const artist = await findIdBySlug(slug);
    res.json(artist);
  } catch (error) {
    logger.error(error);
    res.sendStatus(400);
  }
});

router.use(requireLogin);

router.get("/", async (req, res) => {
  try {
    const { _id: userId } = req.user as IUser;
    const artists = await getUserArtists(userId);
    res.send(artists);
  } catch (error) {
    logger.error(error);
    res.sendStatus(400);
  }
});

router.post("/:artistId", async (req, res) => {
  try {
    const { name, slug, biography, links } = req.body;
    const { artistId } = req.params;
    const { _id: userId } = req.user as IUser;
    const artist = (await updateArtist({ artistId, name, slug, biography, links, userId })) as IArtist;
    res.send(artist);
  } catch (error: any) {
    if (error.codeName === "DuplicateKey") {
      return void res.send({
        error: "Save failed. This artist slug is already in use. Please try another.",
        name: "slug",
        value: "This slug is in use. Please try another."
      });
    }

    if (error instanceof Error.ValidationError) {
      const { errors } = error;
      const errorKeys = Object.keys(errors);
      const errorKey = errorKeys[0];
      const { message, path } = errors[errorKey];
      return void res.send({ error: message, name: path, value: message });
    }

    logger.error(error);
    res.sendStatus(400);
  }
});

router.post("/:artistId/follow", async (req, res) => {
  try {
    const { _id: userId } = req.user as IUser;
    const { artistId } = req.params;
    await followArtist(artistId, userId);
    res.sendStatus(200);
  } catch (error) {
    logger.error(error);
    res.sendStatus(400);
  }
});

router.delete("/:artistId/follow", async (req, res) => {
  try {
    const { _id: userId } = req.user as IUser;
    const { artistId } = req.params;
    await unfollowArtist(artistId, userId);
    res.sendStatus(200);
  } catch (error) {
    logger.error(error);
    res.sendStatus(400);
  }
});

router.patch("/:artistId/link", async (req, res) => {
  try {
    const { _id: userId } = req.user as IUser;
    const { artistId } = req.params;
    const newLink = await addLink(artistId, userId);
    res.send(newLink);
  } catch (error) {
    logger.error(error);
    res.sendStatus(400);
  }
});

router.get("/activity", async (req, res) => {
  try {
    const { _id: userId } = req.user as IUser;
    const activity = await getActivity(userId);
    res.json(activity);
  } catch (error) {
    logger.error(error);
    res.sendStatus(400);
  }
});

export default router;
