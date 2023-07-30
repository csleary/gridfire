import {
  getDaiContract,
  getGridFireEditionsContract,
  getGridFirePaymentContract
} from "gridfire/controllers/web3/index.js";
import express from "express";
import mongoose from "mongoose";
import requireLogin from "gridfire/middlewares/requireLogin.js";
import { EventLog } from "ethers";

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

router.get("/claims", requireLogin, async (req, res) => {
  try {
    const { _id: userId } = req.user || {};
    if (!userId) return res.sendStatus(401);
    const { account } = await User.findById(userId).exec();
    const gridFirePaymentContract = getGridFirePaymentContract();
    const claimFilter = gridFirePaymentContract.filters.Claim(account);
    const claims = (await gridFirePaymentContract.queryFilter(claimFilter)) as EventLog[];

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
    const { _id: userId } = req.user || {};
    if (!userId) return res.sendStatus(401);
    const { paymentAddress } = await User.findById(userId).exec();
    const gridFirePaymentContract = getGridFirePaymentContract();
    const purchaseFilter = gridFirePaymentContract.filters.Purchase(null, paymentAddress);
    const gridFireEditionsContract = getGridFireEditionsContract();
    const purchaseEditionFilter = gridFireEditionsContract.filters.PurchaseEdition(null, paymentAddress);

    const [purchases, editionPurchases] = await Promise.all([
      gridFirePaymentContract.queryFilter(purchaseFilter),
      gridFireEditionsContract.queryFilter(purchaseEditionFilter)
    ]);

    const leanPurchases = [...(purchases as EventLog[]), ...(editionPurchases as EventLog[])]
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

export default router;
