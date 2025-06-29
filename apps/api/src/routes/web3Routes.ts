import logger from "@gridfire/api/controllers/logger";
import {
  getBlockNumber,
  getDaiContract,
  getGridfirePaymentContract,
  getResolvedAddress
} from "@gridfire/api/controllers/web3/index";
import requireLogin from "@gridfire/api/middlewares/requireLogin";
import Sale from "@gridfire/shared/models/Sale";
import { IUser } from "@gridfire/shared/models/User";
import { EventLog } from "ethers";
import express from "express";
import { Types } from "mongoose";

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

    const purchases = await Sale.aggregate([
      { $match: { user: new Types.ObjectId(userId.toString()) } },
      {
        $facet: {
          single: [
            { $match: { type: "single" } },
            {
              $lookup: {
                from: "releases",
                localField: "release",
                foreignField: "trackList._id",
                let: { trackId: "$release" },
                pipeline: [
                  { $unwind: "$trackList" },
                  {
                    $match: {
                      $expr: {
                        $eq: ["$trackList._id", "$$trackId"]
                      }
                    }
                  }
                ],
                as: "release"
              }
            },
            {
              $project: {
                artistId: { $first: "$release.artist" },
                artistName: { $first: "$release.artistName" },
                blockNumber: 1,
                paid: 1,
                releaseId: { $first: "$release._id" },
                releaseTitle: { $first: "$release.releaseTitle" },
                trackTitle: { $first: "$release.trackList.trackTitle" },
                transactionHash: 1
              }
            }
          ],
          album: [
            { $match: { type: { $in: ["edition", "album"] } } },
            {
              $lookup: {
                from: "releases",
                localField: "release",
                foreignField: "_id",
                as: "release"
              }
            },
            {
              $project: {
                artistId: { $first: "$release.artist" },
                artistName: { $first: "$release.artistName" },
                blockNumber: 1,
                paid: 1,
                releaseId: { $first: "$release._id" },
                releaseTitle: { $first: "$release.releaseTitle" },
                transactionHash: 1
              }
            }
          ]
        }
      },
      {
        $project: {
          purchases: { $concatArrays: ["$single", "$album"] }
        }
      },
      { $unwind: "$purchases" },
      { $replaceRoot: { newRoot: "$purchases" } },
      { $sort: { blockNumber: -1 } }
    ]).exec();

    res.json(purchases);
  } catch (error) {
    logger.error(error);
    res.sendStatus(400);
  }
});

router.get("/sales", requireLogin, async (req, res) => {
  try {
    const { paymentAddress } = req.user as IUser;

    const sales = await Sale.aggregate([
      { $match: { artistAddress: paymentAddress } },
      {
        $facet: {
          single: [
            { $match: { type: "single" } },
            {
              $lookup: {
                from: "releases",
                localField: "release",
                foreignField: "trackList._id",
                let: { trackId: "$release" },
                pipeline: [
                  { $unwind: "$trackList" },
                  {
                    $match: {
                      $expr: {
                        $eq: ["$trackList._id", "$$trackId"]
                      }
                    }
                  }
                ],
                as: "release"
              }
            },
            {
              $project: {
                artistShare: "$netAmount",
                blockNumber: 1,
                platformFee: "$fee",
                releaseId: { $first: "$release._id" },
                transactionHash: 1,
                userAddress: 1
              }
            }
          ],
          album: [
            { $match: { type: { $in: ["edition", "album"] } } },
            {
              $lookup: {
                from: "releases",
                localField: "release",
                foreignField: "_id",
                as: "release"
              }
            },
            {
              $project: {
                artistShare: "$netAmount",
                blockNumber: 1,
                platformFee: "$fee",
                releaseId: { $first: "$release._id" },
                transactionHash: 1,
                userAddress: 1
              }
            }
          ]
        }
      },
      {
        $project: {
          purchases: { $concatArrays: ["$single", "$album"] }
        }
      },
      { $unwind: "$purchases" },
      { $replaceRoot: { newRoot: "$purchases" } },
      { $sort: { blockNumber: -1 } }
    ]).exec();

    res.json(sales);
  } catch (error) {
    logger.error(error);
    res.sendStatus(400);
  }
});

export default router;
