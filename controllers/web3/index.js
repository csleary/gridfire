import { Contract, ethers, utils } from "ethers";
import GridFirePayment from "gridfire/hardhat/artifacts/contracts/GridFirePayment.sol/GridFirePayment.json" assert { type: "json" };
import Release from "gridfire/models/Release.js";
import User from "gridfire/models/User.js";
import daiAbi from "gridfire/controllers/web3/dai.js";

const { CONTRACT_ADDRESS, DAI_CONTRACT_ADDRESS, NETWORK_URL, NETWORK_KEY } = process.env;
const { abi } = GridFirePayment;

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

const getGridFireEdition = async editionId => {
  const provider = getProvider();
  const gridFireContract = getGridFireContract(provider);
  return gridFireContract.getEdition(editionId);
};

const getGridFireEditionsByReleaseId = async releaseId => {
  const provider = getProvider();
  const gridFireContract = getGridFireContract(provider);
  const [ids, editions, balances] = await gridFireContract.getEditionsByReleaseId(releaseId);
  const release = await Release.findById(releaseId, "", { lean: true }).populate("user").exec();
  const { account: artistAccount } = release.user;
  const mintFilter = gridFireContract.filters.TransferSingle(artistAccount, null, CONTRACT_ADDRESS);
  const mintEvents = await gridFireContract.queryFilter(mintFilter);

  const amounts = await Promise.all(
    ids.map(async id => {
      const mintEvent = mintEvents.find(mint => mint.args.id._hex === id._hex);
      return mintEvent.args.value;
    })
  );

  return editions
    .map((edition, index) => ({
      ...edition,
      id: ids[index],
      amount: amounts[index],
      balance: balances[index]
    }))
    .filter(({ artist }) => artist.toLowerCase() === artistAccount.toLowerCase()); // Don't trust minted editions.
};

const getTransaction = async txId => {
  const provider = getProvider();
  const tx = await provider.getTransaction(txId);
  const iface = new utils.Interface(abi);
  const parsedTx = iface.parseTransaction(tx);
  return parsedTx;
};

const getUserGridFireEditions = async userId => {
  const { account } = await User.findById(userId).exec();
  const provider = getProvider();
  const gridFireContract = getGridFireContract(provider);
  const editionsPurchaseFilter = gridFireContract.filters.PurchaseEdition(account);
  const purchases = await gridFireContract.queryFilter(editionsPurchaseFilter);
  const ids = purchases.map(purchase => purchase.args.editionId);
  const releaseIds = purchases.map(purchase => purchase.args.releaseId);
  4;

  const releases = await Release.find(
    { _id: { $in: releaseIds } },
    "artistName artwork releaseTitle trackList._id trackList.trackTitle",
    { lean: true }
  ).exec();

  const accounts = Array(ids.length).fill(account);
  const balances = await gridFireContract.balanceOfBatch(accounts, ids);

  const editions = balances.map((balance, index) => ({
    _id: purchases[index].transactionHash,
    balance,
    id: ids[index],
    paid: purchases[index].args.amountPaid,
    release: releases[index],
    transaction: { transactionHash: purchases[index].transactionHash }
  }));

  return editions;
};

export {
  getDaiContract,
  getGridFireContract,
  getGridFireEdition,
  getGridFireEditionsByReleaseId,
  getProvider,
  getTransaction,
  getUserGridFireEditions
};
