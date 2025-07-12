import logger from "@gridfire/api/controllers/logger";
import { getResolvedAddress } from "@gridfire/api/controllers/web3";
import requireLogin from "@gridfire/api/middlewares/requireLogin";
import Approval from "@gridfire/shared/models/Approval";
import Claim from "@gridfire/shared/models/Claim";
import Sale from "@gridfire/shared/models/Sale";
import { IUser } from "@gridfire/shared/models/User";
import { Router } from "express";
import { Types } from "mongoose";

const router = Router();

router.get("/approvals/:account", requireLogin, async (req, res) => {
  try {
    const { account } = req.params;
    const approvals = await Approval.find({ owner: account }, {}, { sort: { createdAt: -1, value: -1 } }).lean();
    res.json(approvals);
  } catch (error) {
    logger.error(error);
    res.sendStatus(400);
  }
});

router.get("/claims", requireLogin, async (req, res) => {
  try {
    const { account } = req.user as IUser;
    const claims = await Claim.find({ artist: account }).lean();
    res.json(claims);
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
          album: [
            { $match: { type: { $in: ["edition", "album"] } } },
            {
              $lookup: {
                as: "release",
                foreignField: "_id",
                from: "releases",
                localField: "release"
              }
            },
            {
              $project: {
                artistId: { $first: "$release.artist" },
                artistName: { $first: "$release.artistName" },
                blockNumber: 1,
                logIndex: 1,
                paid: 1,
                releaseId: { $first: "$release._id" },
                releaseTitle: { $first: "$release.releaseTitle" },
                transactionHash: 1
              }
            }
          ],
          single: [
            { $match: { type: "single" } },
            {
              $lookup: {
                as: "release",
                foreignField: "trackList._id",
                from: "releases",
                let: { trackId: "$release" },
                localField: "release",
                pipeline: [
                  { $unwind: "$trackList" },
                  {
                    $match: {
                      $expr: {
                        $eq: ["$trackList._id", "$$trackId"]
                      }
                    }
                  }
                ]
              }
            },
            {
              $project: {
                artistId: { $first: "$release.artist" },
                artistName: { $first: "$release.artistName" },
                blockNumber: 1,
                logIndex: 1,
                paid: 1,
                releaseId: { $first: "$release._id" },
                releaseTitle: { $first: "$release.releaseTitle" },
                trackTitle: { $first: "$release.trackList.trackTitle" },
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
          album: [
            { $match: { type: { $in: ["edition", "album"] } } },
            {
              $lookup: {
                as: "release",
                foreignField: "_id",
                from: "releases",
                localField: "release"
              }
            },
            {
              $project: {
                artistShare: "$netAmount",
                blockNumber: 1,
                logIndex: 1,
                platformFee: "$fee",
                releaseId: { $first: "$release._id" },
                transactionHash: 1,
                userAddress: 1
              }
            }
          ],
          single: [
            { $match: { type: "single" } },
            {
              $lookup: {
                as: "release",
                foreignField: "trackList._id",
                from: "releases",
                let: { trackId: "$release" },
                localField: "release",
                pipeline: [
                  { $unwind: "$trackList" },
                  {
                    $match: {
                      $expr: {
                        $eq: ["$trackList._id", "$$trackId"]
                      }
                    }
                  }
                ]
              }
            },
            {
              $project: {
                artistShare: "$netAmount",
                blockNumber: 1,
                logIndex: 1,
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
