import {
  getBlockNumber,
  getDaiContract,
  getGridfirePaymentContract,
  getResolvedAddress
} from "@gridfire/api/controllers/web3/index";
import requireLogin from "@gridfire/api/middlewares/requireLogin";
import Release from "@gridfire/shared/models/Release";
import Sale from "@gridfire/shared/models/Sale";
import { EventLog } from "ethers";
import express from "express";
import mongoose from "mongoose";

const { User } = mongoose.models;
const { GRIDFIRE_PAYMENT_ADDRESS } = process.env;
const router = express.Router();

router.get("/approvals/:account", requireLogin, async (req, res) => {
  try {
    const { account } = req.params;
    const daiContract = getDaiContract();
    const approvalsFilter = daiContract.filters.Approval(account, GRIDFIRE_PAYMENT_ADDRESS);
    const currentBlock = await getBlockNumber();
    const approvals = (await daiContract.queryFilter(approvalsFilter, currentBlock - 100)) as EventLog[];

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
    // should be in the db instead.
    const { _id: userId } = req.user || {};
    if (!userId) return void res.sendStatus(401);
    const { account } = await User.findById(userId).exec();
    const gridfirePaymentContract = getGridfirePaymentContract();
    const claimFilter = gridfirePaymentContract.filters.Claim(account);
    const currentBlock = await getBlockNumber();
    const claims = (await gridfirePaymentContract.queryFilter(claimFilter, currentBlock - 100)) as EventLog[];

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
    if (!userId) return void res.sendStatus(401);
    const purchases = await Sale.find({ user: userId }).populate({ path: "release", model: Release }).lean();
    res.json(purchases);
  } catch (error) {
    console.error(error);
    res.sendStatus(400);
  }
});

router.get("/sales", requireLogin, async (req, res) => {
  try {
    const { _id: userId } = req.user || {};
    if (!userId) return void res.sendStatus(401);
    const { paymentAddress } = await User.findById(userId).exec();
    const sales = await Sale.find({ artistAddress: paymentAddress }, {}).lean();
    res.json(sales);
  } catch (error) {
    console.error(error);
    res.sendStatus(400);
  }
});

export default router;
