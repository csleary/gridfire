import {
  getDaiContract,
  getGridFireContract,
  getGridFireEditionsByReleaseId,
  getGridFireEditionUris,
  getUserGridFireEditions
} from "gridfire/controllers/web3/index.js";
import Release from "gridfire/models/Release.js";
import express from "express";
import requireLogin from "gridfire/middlewares/requireLogin.js";

const { CONTRACT_ADDRESS } = process.env;
const router = express.Router();

router.get("/approvals/:account", requireLogin, async (req, res) => {
  try {
    const { account } = req.params;
    const daiContract = getDaiContract();
    const approvalsFilter = daiContract.filters.Approval(account, CONTRACT_ADDRESS);
    const approvals = await daiContract.queryFilter(approvalsFilter);
    res.send(approvals);
  } catch (error) {
    console.error(error);
    res.sendStatus(400);
  }
});

router.get("/claims/:account", requireLogin, async (req, res) => {
  try {
    const { account } = req.params;
    const gridFireContract = getGridFireContract();
    const claimFilter = gridFireContract.filters.Claim(account);
    const claims = await gridFireContract.queryFilter(claimFilter);
    res.send(claims);
  } catch (error) {
    console.error(error);
    res.sendStatus(400);
  }
});

router.get("/purchases/:account", requireLogin, async (req, res) => {
  try {
    const { account } = req.params;
    const gridFireContract = getGridFireContract();
    const purchaseFilter = gridFireContract.filters.Purchase(null, account);
    const purchases = await gridFireContract.queryFilter(purchaseFilter);
    res.send(purchases);
  } catch (error) {
    console.error(error);
    res.sendStatus(400);
  }
});

router.get("/editions/:releaseId", requireLogin, async (req, res) => {
  try {
    const { releaseId } = req.params;
    const editions = await getGridFireEditionsByReleaseId(releaseId);
    res.json(editions);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message || error.toString() });
  }
});

router.get("/editions/uri/:releaseId", requireLogin, async (req, res) => {
  try {
    const { releaseId } = req.params;
    const uris = await getGridFireEditionUris(releaseId);
    res.json(uris);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message || error.toString() });
  }
});

router.get("/editions/user/:userId", requireLogin, async (req, res) => {
  try {
    const { userId } = req.params;
    const editions = await getUserGridFireEditions(userId);
    res.json(editions);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message || error.toString() });
  }
});

router.post("/mint", requireLogin, async (req, res) => {
  try {
    const { ipfs } = req.app.locals;
    const { description, price, releaseId, amount } = req.body;
    const release = await Release.findById(releaseId, "", { lean: true });
    const { catNumber, credits, info, releaseDate, releaseTitle: title, artistName: artist, artwork } = release;
    const priceInDai = Number(price).toFixed(2);

    const tokenMetadata = {
      name: title,
      description: description || `${artist} - ${title} (GridFire edition)`,
      image: `ipfs://${artwork.cid}`,
      properties: {
        artist,
        title,
        totalSupply: amount,
        priceInDai,
        releaseDate: new Date(releaseDate).toUTCString(),
        catalogueNumber: catNumber,
        info,
        credits
      }
    };

    const upload = await ipfs.add(JSON.stringify(tokenMetadata), { cidVersion: 1 });
    const metadataUri = `ipfs://${upload.cid.toString()}`;
    res.send(metadataUri);
  } catch (error) {
    console.error(error);
    res.sendStatus(400);
  }
});

export default router;
