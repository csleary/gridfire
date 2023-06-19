import {
  getDaiContract,
  getGridFireEditionUris,
  getGridFireEditionsByReleaseId,
  getGridFireEditionsContract,
  getGridFirePaymentContract,
  getUserGridFireEditions
} from "gridfire/controllers/web3/index.js";
import express from "express";
import { getArtworkStream } from "gridfire/controllers/artworkController.js";
import ipfs from "gridfire/controllers/ipfsController.js";
import mongoose from "mongoose";
import { parseEther } from "ethers";
import requireLogin from "gridfire/middlewares/requireLogin.js";

const { Edition, Release, User } = mongoose.models;
const { GRIDFIRE_PAYMENT_ADDRESS } = process.env;
const router = express.Router();

router.get("/approvals/:account", requireLogin, async (req, res) => {
  try {
    const { account } = req.params;
    const daiContract = getDaiContract();
    const approvalsFilter = daiContract.filters.Approval(account, GRIDFIRE_PAYMENT_ADDRESS);
    const approvals = await daiContract.queryFilter(approvalsFilter);

    const leanApprovals = approvals.map(({ args, blockNumber, transactionHash }) => {
      const { wad } = args;

      return {
        amount: wad.toString(),
        blockNumber,
        transactionHash
      };
    });

    res.send(leanApprovals);
  } catch (error) {
    console.error(error);
    res.sendStatus(400);
  }
});

router.get("/claims", requireLogin, async (req, res) => {
  try {
    const { _id: userId } = req.user;
    const { account } = await User.findById(userId).exec();
    const gridFirePaymentContract = getGridFirePaymentContract();
    const claimFilter = gridFirePaymentContract.filters.Claim(account);
    const claims = await gridFirePaymentContract.queryFilter(claimFilter);

    const leanClaims = claims.map(({ args, blockNumber, transactionHash }) => {
      const { amount } = args;

      return {
        amount: amount.toString(),
        blockNumber,
        transactionHash
      };
    });

    res.send(leanClaims);
  } catch (error) {
    console.error(error);
    res.sendStatus(400);
  }
});

router.get("/purchases", requireLogin, async (req, res) => {
  try {
    const { _id: userId } = req.user;
    const { paymentAddress } = await User.findById(userId).exec();
    const gridFirePaymentContract = getGridFirePaymentContract();
    const purchaseFilter = gridFirePaymentContract.filters.Purchase(null, paymentAddress);
    const gridFireEditionsContract = getGridFireEditionsContract();
    const purchaseEditionFilter = gridFireEditionsContract.filters.PurchaseEdition(null, paymentAddress);

    const [purchases, editionPurchases] = await Promise.all([
      gridFirePaymentContract.queryFilter(purchaseFilter),
      gridFireEditionsContract.queryFilter(purchaseEditionFilter)
    ]);

    const leanPurchases = [...purchases, ...editionPurchases]
      .map(({ args, blockNumber, transactionHash }) => {
        const { buyer, editionId, releaseId, artistShare, platformFee } = args;

        return {
          blockNumber,
          buyer,
          ...(editionId ? { editionId: editionId.toString() } : {}),
          releaseId,
          artistShare: artistShare.toString(),
          platformFee: platformFee.toString(),
          transactionHash
        };
      })
      .sort((a, b) => a.blockNumber - b.blockNumber);

    res.json(leanPurchases);
  } catch (error) {
    console.error(error);
    res.sendStatus(400);
  }
});

router.get("/editions/user", requireLogin, async (req, res) => {
  try {
    const { _id: userId } = req.user;
    const editions = await getUserGridFireEditions(userId);
    res.json(editions);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message || error.toString() });
  }
});

router.post("/editions/mint", requireLogin, async (req, res) => {
  try {
    const { body, hostname, protocol } = req;
    const { amount, description, price, releaseId, tracks: trackIds } = body;
    const release = await Release.findById(releaseId).exec();
    const { artistName: artist, catNumber, credits, info, releaseDate, releaseTitle: title, trackList } = release;
    const priceInDai = Number(price).toFixed(2);
    const weiPrice = parseEther(price);

    const tracks = trackList
      .filter(track => trackIds.some(id => track._id.equals(id)))
      .map(({ _id, trackTitle }) => ({ id: _id.toString(), title: trackTitle }));

    const artworkStream = await getArtworkStream(releaseId);
    const uploadArtwork = await ipfs.add(artworkStream, { cidVersion: 1 });
    const cidArtwork = uploadArtwork.cid.toString();

    const tokenMetadata = {
      attributes: {
        display_type: "date",
        trait_type: "Release date",
        value: Date.parse(releaseDate)
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
      release: releaseId,
      amount,
      price: weiPrice.toString(),
      metadata: tokenMetadata,
      cid
    });

    const metadataUri = `ipfs://${cid}`;
    res.send({ metadataUri, objectId });
  } catch (error) {
    console.error(error);
    res.sendStatus(400);
  }
});

router.get("/editions/:releaseId", async (req, res) => {
  try {
    const { releaseId } = req.params;
    const editions = await getGridFireEditionsByReleaseId(releaseId);
    res.json(editions);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message || error.toString() });
  }
});

router.get("/editions/:releaseId/uri", requireLogin, async (req, res) => {
  try {
    const { releaseId } = req.params;
    const uris = await getGridFireEditionUris(releaseId);
    res.json(uris);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message || error.toString() });
  }
});

export default router;
