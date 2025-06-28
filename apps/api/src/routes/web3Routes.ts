import logger from "@gridfire/api/controllers/logger";
import {
  getBlockNumber,
  getDaiContract,
  getGridfirePaymentContract,
  getResolvedAddress
} from "@gridfire/api/controllers/web3/index";
import requireLogin from "@gridfire/api/middlewares/requireLogin";
import Release from "@gridfire/shared/models/Release";
import Sale from "@gridfire/shared/models/Sale";
import { IUser } from "@gridfire/shared/models/User";
import { EventLog } from "ethers";
import express from "express";

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
    logger.error(error);
    res.sendStatus(400);
  }
});

router.get("/claims", requireLogin, async (req, res) => {
  try {
    const { account } = req.user as IUser;
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
    logger.error(error);
    res.sendStatus(400);
  }
});

router.get("/domain/:ensDomain", requireLogin, async (req, res) => {
  try {
    const { ensDomain } = req.params;
    const resolvedAddress = await getResolvedAddress(ensDomain);
    res.send(resolvedAddress);
  } catch (error) {
    logger.error(error);
    res.sendStatus(400);
  }
});

router.get("/purchases/:account", requireLogin, async (req, res) => {
  try {
    const { _id: userId } = req.user as IUser;
    const purchases = await Sale.find({ user: userId }).populate({ path: "release", model: Release }).lean();
    res.json(purchases);
  } catch (error) {
    logger.error(error);
    res.sendStatus(400);
  }
});

router.get("/sales", requireLogin, async (req, res) => {
  try {
    const { paymentAddress } = req.user as IUser;
    const sales = await Sale.find({ artistAddress: paymentAddress }, {}).lean();
    res.json(sales);
  } catch (error) {
    logger.error(error);
    res.sendStatus(400);
  }
});

export default router;
