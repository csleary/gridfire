import {
  getGridFireEditionUris,
  getGridFireEditionsByReleaseId,
  getUserGridFireEditions,
  setVisibility
} from "gridfire/controllers/web3/index.js";
import { IRelease } from "gridfire/models/Release.js";
import express from "express";
import { getArtworkStream } from "gridfire/controllers/artworkController.js";
import ipfs from "gridfire/controllers/ipfsController.js";
import mongoose from "mongoose";
import { parseEther } from "ethers";
import requireLogin from "gridfire/middlewares/requireLogin.js";

const { Edition, Release } = mongoose.models;
const router = express.Router();

router.get("/user", requireLogin, async (req, res) => {
  try {
    const { _id: userId } = req.user || {};
    if (!userId) return res.sendStatus(401);
    const editions = await getUserGridFireEditions(userId);
    res.json(editions);
  } catch (error: any) {
    console.error(error);
    res.status(400).json({ error: error.message || error.toString() });
  }
});

router.get("/:releaseId", async (req, res) => {
  try {
    const { releaseId } = req.params;

    const editions = await getGridFireEditionsByReleaseId({
      release: releaseId,
      status: "minted",
      visibility: "visible"
    });

    res.json(editions);
  } catch (error: any) {
    console.error(error);
    res.status(400).json({ error: error.message || error.toString() });
  }
});

router.use(requireLogin);

router.post("/mint", async (req, res) => {
  try {
    const { _id: user } = req.user || {};
    const { body, hostname, protocol } = req;
    const { amount, description, price, releaseId, tracks: trackIds } = body;
    const release = await Release.findById(releaseId).exec();

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
      description: description || `${artist} - ${title} (GridFire edition)`,
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
    console.error(error);
    res.sendStatus(400);
  }
});

router.get("/:releaseId/uri", async (req, res) => {
  try {
    const { releaseId } = req.params;
    const uris = await getGridFireEditionUris(releaseId);
    res.json(uris);
  } catch (error: any) {
    console.error(error);
    res.status(400).json({ error: error.message || error.toString() });
  }
});

router.get("/:releaseId/minted", async (req, res) => {
  try {
    const { _id: user } = req.user || {};
    const { releaseId } = req.params;

    const editions = await getGridFireEditionsByReleaseId({
      release: releaseId,
      status: "minted",
      user
    });

    res.json(editions);
  } catch (error: any) {
    console.error(error);
    res.status(400).json({ error: error.message || error.toString() });
  }
});

router.patch("/:editionId/visibility", async (req, res) => {
  try {
    const { _id: userId } = req.user || {};
    if (!userId) return res.sendStatus(401);
    const { editionId } = req.params;
    const { visibility } = req.body;
    console.log(`Hiding edition ${editionId} for user ${userId}…`);
    await setVisibility(userId, editionId, visibility);
    console.log(`Edition ${editionId} hidden for user ${userId}.`);
    res.sendStatus(200);
  } catch (error: any) {
    console.error(error);
    res.status(400).json({ error: error.message || error.toString() });
  }
});

export default router;
