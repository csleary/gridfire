import { EventLog, decodeBytes32String } from "ethers";
import {
  getBlockNumber,
  getDaiContract,
  getGridfireEditionsContract,
  getGridfirePaymentContract,
  getResolvedAddress
} from "gridfire/controllers/web3/index.js";
import express from "express";
import mongoose, { ObjectId } from "mongoose";
import requireLogin from "gridfire/middlewares/requireLogin.js";

import Release, { IRelease } from "gridfire/models/Release.js";

const { User } = mongoose.models;
const { GRIDFIRE_PAYMENT_ADDRESS } = process.env;
const router = express.Router();

router.get("/approvals/:account", requireLogin, async (req, res) => {
  try {
    const { account } = req.params;
    const daiContract = getDaiContract();
    const approvalsFilter = daiContract.filters.Approval(account, GRIDFIRE_PAYMENT_ADDRESS);
    const approvals = (await daiContract.queryFilter(approvalsFilter)) as EventLog[];

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

// Batched option, but not needed for now.

// async function getClaimsBatched(account: string) {
//   const batchSize = 10_000n;
//   const blockNumber = await getBlockNumber();
//   const gridFirePaymentContract = getGridfirePaymentContract();
//   const claimFilter = gridFirePaymentContract.filters.Claim(account);
//   const claims = [];

//   for (let fromBlock = 0n; fromBlock < BigInt(blockNumber); fromBlock += batchSize) {
//     const toBlock = fromBlock + batchSize - 1n;
//     const batch = await gridFirePaymentContract.queryFilter(claimFilter, fromBlock, toBlock);
//     claims.push(...(batch as EventLog[]));
//   }

//   return claims;
// }

router.get("/claims", requireLogin, async (req, res) => {
  try {
    const { _id: userId } = req.user || {};
    if (!userId) return res.sendStatus(401);
    const { account } = await User.findById(userId).exec();
    const gridfirePaymentContract = getGridfirePaymentContract();
    const claimFilter = gridfirePaymentContract.filters.Claim(account);
    const claims = (await gridfirePaymentContract.queryFilter(claimFilter)) as EventLog[];

    const leanClaims = claims.map(({ args, blockNumber, transactionHash }) => ({
      amount: args.amount.toString(),
      blockNumber,
      transactionHash
    }));

    res.json(leanClaims);
  } catch (error) {
    console.error(error);
    res.sendStatus(400);
  }
});

router.get("/domain/:ensDomain", requireLogin, async (req, res) => {
  try {
    const { ensDomain } = req.params;
    const resolvedAddress = await getResolvedAddress(ensDomain);
    res.send(resolvedAddress);
  } catch (error) {
    console.error(error);
    res.sendStatus(400);
  }
});

router.get("/purchases/:account", requireLogin, async (req, res) => {
  try {
    const { _id: userId } = req.user || {};
    if (!userId) return res.sendStatus(401);
    const { account } = req.params;
    const gridfirePaymentContract = getGridfirePaymentContract();
    const purchaseFilter = gridfirePaymentContract.filters.Purchase(account);
    const gridfireEditionsContract = getGridfireEditionsContract();
    const purchaseEditionFilter = gridfireEditionsContract.filters.PurchaseEdition(account);

    const [purchases, editionPurchases] = await Promise.all([
      gridfirePaymentContract.queryFilter(purchaseFilter),
      gridfireEditionsContract.queryFilter(purchaseEditionFilter)
    ]);

    const leanPurchases = [...(purchases as EventLog[]), ...(editionPurchases as EventLog[])].map(
      ({ args, blockNumber, transactionHash }) => {
        const { amountPaid, editionId, releaseId } = args;

        return {
          amountPaid: amountPaid.toString(),
          blockNumber,
          ...(editionId ? { editionId: editionId.toString() } : {}),
          releaseId: decodeBytes32String(releaseId),
          transactionHash
        };
      }
    );

    const sortedPurchases = leanPurchases.sort((a, b) => a.blockNumber - b.blockNumber);

    const withReleaseInfo = await Promise.all(
      sortedPurchases.map(async ({ releaseId, ...purchase }) => {
        const release = await Release.findOne(
          { $or: [{ _id: releaseId }, { "trackList._id": releaseId }] },
          { artistId: "$artist", artistName: 1, releaseTitle: 1, "trackList.trackTitle": 1 }
        ).exec();

        if (!release) {
          return { ...purchase, releaseId };
        }

        const { artistId, artistName, releaseTitle } = release.toJSON() as IRelease & { artistId: ObjectId };
        return { ...purchase, artistId, artistName, releaseId, releaseTitle };
      })
    );

    res.json(withReleaseInfo);
  } catch (error) {
    console.error(error);
    res.sendStatus(400);
  }
});

router.get("/sales", requireLogin, async (req, res) => {
  try {
    const { _id: userId } = req.user || {};
    if (!userId) return res.sendStatus(401);
    const { paymentAddress } = await User.findById(userId).exec();
    const gridFirePaymentContract = getGridfirePaymentContract();
    const purchaseFilter = gridFirePaymentContract.filters.Purchase(null, paymentAddress);
    const gridFireEditionsContract = getGridfireEditionsContract();
    const purchaseEditionFilter = gridFireEditionsContract.filters.PurchaseEdition(null, paymentAddress);

    const [purchases, editionPurchases] = await Promise.all([
      gridFirePaymentContract.queryFilter(purchaseFilter),
      gridFireEditionsContract.queryFilter(purchaseEditionFilter)
    ]);

    const leanPurchases = await Promise.all(
      [...(purchases as EventLog[]), ...(editionPurchases as EventLog[])]
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
        .sort((a, b) => a.blockNumber - b.blockNumber)
    );

    res.json(leanPurchases);
  } catch (error) {
    console.error(error);
    res.sendStatus(400);
  }
});

export default router;
