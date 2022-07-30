import { Contract, ethers, utils } from "ethers";
import GridFirePayment from "gridfire/hardhat/artifacts/contracts/GridFirePayment.sol/GridFirePayment.json" assert { type: "json" };
import Release from "gridfire/models/Release.js";
import Sale from "gridfire/models/Sale.js";
import User from "gridfire/models/User.js";
import daiAbi from "gridfire/controllers/web3/dai.js";
import express from "express";
import { publishToQueue } from "gridfire/controllers/amqp/publisher.js";
import requireLogin from "gridfire/middlewares/requireLogin.js";

const { CONTRACT_ADDRESS, DAI_CONTRACT_ADDRESS, NETWORK_URL, NETWORK_KEY } = process.env;
const { abi } = GridFirePayment;
const router = express.Router();

const getProvider = () => {
  return ethers.getDefaultProvider(`${NETWORK_URL}/${NETWORK_KEY}`);
};

const getDaiContract = () => {
  const provider = getProvider();
  return new Contract(DAI_CONTRACT_ADDRESS, daiAbi, provider);
};

const getGridFireContract = () => {
  const provider = getProvider();
  return new Contract(CONTRACT_ADDRESS, abi, provider);
};

router.get("/:account/approvals", requireLogin, async (req, res) => {
  const { account } = req.params;
  const daiContract = getDaiContract();
  const approvalsFilter = daiContract.filters.Approval(account, CONTRACT_ADDRESS);
  const approvals = await daiContract.queryFilter(approvalsFilter);
  res.send(approvals);
});

router.get("/:account/claims", requireLogin, async (req, res) => {
  const { account } = req.params;
  const gridFire = getGridFireContract();
  const claimFilter = gridFire.filters.Claim(account);
  const claims = await gridFire.queryFilter(claimFilter);
  res.send(claims);
});

router.get("/:account/purchases", requireLogin, async (req, res) => {
  const { account } = req.params;
  const gridFire = getGridFireContract();
  const purchaseFilter = gridFire.filters.Purchase(null, account);
  const purchases = await gridFire.queryFilter(purchaseFilter);
  res.send(purchases);
});

/**
 * Contract Events
 */

const gridFire = getGridFireContract();

gridFire.on(
  "Purchase",
  async (buyerAddress, artistAddress, releaseId, userId, amountPaid, artistShare, platformFee, event) => {
    const {
      artistName,
      price,
      releaseTitle,
      user: artistUser
    } = await Release.findById(releaseId, "artistName price releaseTitle", { lean: true })
      .populate({ path: "user", model: User, options: { lean: true }, select: "paymentAddress" })
      .exec();

    if (utils.getAddress(artistUser.paymentAddress) !== utils.getAddress(artistAddress)) {
      return;
    }

    if (amountPaid.lt(utils.parseEther(price.toString()))) {
      return;
    }

    if (await Sale.exists({ release: releaseId, user: userId })) {
      return;
    }

    const transactionReceipt = await event.getTransactionReceipt();
    const { from: buyer, status } = transactionReceipt;

    if (status === 1) {
      await Sale.create({
        purchaseDate: Date.now(),
        release: releaseId,
        paid: amountPaid,
        transaction: transactionReceipt,
        user: userId,
        userAddress: buyer
      }).catch(error => {
        if (error.code === 11000) {
          return;
        }
        console.error(error);
      });

      publishToQueue("user", userId, { artistName, releaseTitle, type: "purchaseEvent", userId });
      const artistUserId = artistUser._id.toString();

      publishToQueue("user", artistUserId, {
        artistName,
        artistShare: utils.formatEther(artistShare),
        buyerAddress,
        platformFee: utils.formatEther(platformFee),
        releaseTitle,
        type: "saleEvent",
        userId: artistUserId
      });
    }
  }
);

export default router;
