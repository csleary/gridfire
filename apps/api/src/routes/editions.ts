import { getArtworkStream } from "@gridfire/api/controllers/artworkController";
import ipfs from "@gridfire/api/controllers/ipfsController";
import logger from "@gridfire/api/controllers/logger";
import {
  getGridfireEditionsByReleaseId,
  getGridfireEditionUris,
  getUserGridfireEditions,
  setVisibility
} from "@gridfire/api/controllers/web3/index";
import requireLogin from "@gridfire/api/middlewares/requireLogin";
import Edition from "@gridfire/shared/models/Edition";
import Release, { IRelease } from "@gridfire/shared/models/Release";
import type { IUser } from "@gridfire/shared/models/User";
import { parseEther } from "ethers";
import { Router } from "express";

const router = Router();

router.get("/user", requireLogin, async (req, res) => {
  try {
    const { _id: userId } = req.user as IUser;
    const editions = await getUserGridfireEditions(userId);
    res.json(editions);
  } catch (error: any) {
    logger.error(error);
    res.status(400).json({ error: error.message || error.toString() });
  }
});

router.get("/:releaseId", async (req, res) => {
  try {
    const { releaseId } = req.params;

    const editions = await getGridfireEditionsByReleaseId({
      release: releaseId,
      status: "minted",
      visibility: "visible"
    });

    res.json(editions);
  } catch (error: any) {
    logger.error(error);
    res.status(400).json({ error: error.message || error.toString() });
  }
});

router.use(requireLogin);

router.post("/mint", async (req, res) => {
  try {
    const { _id: user } = req.user as IUser;
    const { body, hostname, protocol } = req;
    const { amount, description, price, releaseId, tracks: trackIds } = body;
    const release = await Release.findById(releaseId).exec();

    if (!release) {
      throw new Error("Release not found.");
    }

    const {
      artistName: artist,
      catNumber,
      credits,
      info,
      releaseDate,
      releaseTitle: title,
      trackList
    }: IRelease = release;

    const priceInDai = Number(price).toFixed(2);
    const weiPrice = parseEther(price);

    const tracks = trackList
      .filter(track => trackIds.some((id: string) => track._id.equals(id)))
      .map(({ _id, trackTitle }) => ({ id: _id.toString(), title: trackTitle }));

    const artworkStream = await getArtworkStream(releaseId);
    const uploadArtwork = await ipfs.add(artworkStream, { cidVersion: 1 });
    const cidArtwork = uploadArtwork.cid.toString();

    const tokenMetadata = {
      attributes: {
        display_type: "date",
        trait_type: "Release date",
        value: Date.parse(releaseDate.toISOString())
      },
      name: title,
      description: description || `${artist} - ${title} (Gridfire edition)`,
      external_url: `${protocol}://${hostname}/release/${releaseId}`,
      image: `ipfs://${cidArtwork}`,
      properties: {
        artist,
        title,
        totalSupply: amount,
        tracks,
        price: weiPrice.toString(),
        priceInDai,
        releaseDate: new Date(releaseDate).toUTCString(),
        catalogueNumber: catNumber,
        info,
        credits
      }
    };

    const upload = await ipfs.add(JSON.stringify(tokenMetadata), { cidVersion: 1 });
    const cid = upload.cid.toString();

    const { _id: objectId } = await Edition.create({
      amount,
      cid,
      metadata: tokenMetadata,
      price: weiPrice.toString(),
      release: releaseId,
      user
    });

    const metadataUri = `ipfs://${cid}`;
    res.send({ metadataUri, objectId });
  } catch (error) {
    logger.error(error);
    res.sendStatus(400);
  }
});

router.delete("/mint/:objectId", async (req, res) => {
  try {
    const { _id: user } = req.user as IUser;
    const { objectId } = req.params;
    const edition = await Edition.findById(objectId).exec();
    const { cid } = edition || {};

    if (cid) {
      await ipfs.pin.rm(cid);
    }

    await Edition.deleteOne({ _id: objectId, user }).exec();
    res.sendStatus(200);
  } catch (error) {
    logger.error(error);
    res.sendStatus(400);
  }
});

router.get("/:releaseId/uri", async (req, res) => {
  try {
    const { releaseId } = req.params;
    const uris = await getGridfireEditionUris(releaseId);
    res.json(uris);
  } catch (error: any) {
    logger.error(error);
    res.status(400).json({ error: error.message || error.toString() });
  }
});

router.get("/:releaseId/minted", async (req, res) => {
  try {
    const { _id: user } = req.user as IUser;
    const { releaseId } = req.params;

    const editions = await getGridfireEditionsByReleaseId({
      release: releaseId,
      status: "minted",
      user
    });

    res.json(editions);
  } catch (error: any) {
    logger.error(error);
    res.status(400).json({ error: error.message || error.toString() });
  }
});

router.patch("/:editionId/visibility", async (req, res) => {
  try {
    const { _id: userId } = req.user as IUser;
    const { editionId } = req.params;
    const { visibility } = req.body;
    logger.info(`Hiding edition ${editionId} for user ${userId}…`);
    await setVisibility(userId, editionId, visibility);
    logger.info(`Edition ${editionId} hidden for user ${userId}.`);
    res.sendStatus(200);
  } catch (error: any) {
    logger.error(error);
    res.status(400).json({ error: error.message || error.toString() });
  }
});

export default router;
