import { Contract, ethers } from "ethers";
import GridFirePayment from "gridfire/hardhat/artifacts/contracts/GridFirePayment.sol/GridFirePayment.json" assert { type: "json" };
import daiAbi from "gridfire/controllers/web3/dai.js";
import express from "express";
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

router.get("/:account/claims", requireLogin, async (req, res) => {
  try {
    const { account } = req.params;
    const gridFire = getGridFireContract();
    const claimFilter = gridFire.filters.Claim(account);
    const claims = await gridFire.queryFilter(claimFilter);
    res.send(claims);
  } catch (error) {
    console.error(error);
    res.sendStatus(400);
  }
});

router.get("/:account/purchases", requireLogin, async (req, res) => {
  try {
    const { account } = req.params;
    const gridFire = getGridFireContract();
    const purchaseFilter = gridFire.filters.Purchase(null, account);
    const purchases = await gridFire.queryFilter(purchaseFilter);
    res.send(purchases);
  } catch (error) {
    console.error(error);
    res.sendStatus(400);
  }
});

export default router;
