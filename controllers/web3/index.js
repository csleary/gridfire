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
  const release = await Release.findById(releaseId, "user", { lean: true }).populate("user").exec();
  const artistAccount = utils.getAddress(release.user.account);
  const mintFilter = gridFireContract.filters.EditionMinted(releaseId, artistAccount);
  const mintEvents = await gridFireContract.queryFilter(mintFilter);

  const editions = mintEvents.map(({ args }) => {
    const { amount, editionId, artist, price } = args;
    return { amount, editionId, artist, price, releaseId };
  });

  const accounts = Array(editions.length).fill(CONTRACT_ADDRESS);
  const ids = editions.map(({ editionId }) => editionId);
  const balances = await gridFireContract.balanceOfBatch(accounts, ids);
  editions.forEach((edition, index) => (edition.balance = balances[index]));
  return editions;
};

const getGridFireEditionUris = async releaseId => {
  const provider = getProvider();
  const gridFireContract = getGridFireContract(provider);
  const release = await Release.findById(releaseId, "user", { lean: true }).populate("user").exec();
  const artistAccount = utils.getAddress(release.user.account);
  const mintFilter = gridFireContract.filters.EditionMinted(releaseId, artistAccount);
  const mintEvents = await gridFireContract.queryFilter(mintFilter);
  const ids = mintEvents.map(({ args }) => args.editionId);
  const uris = Promise.all(ids.map(id => gridFireContract.uri(id)));
  return uris;
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
  const editionsPurchaseFilter = gridFireContract.filters.PurchaseEdition(utils.getAddress(account));
  const purchases = await gridFireContract.queryFilter(editionsPurchaseFilter);
  const releaseIds = purchases.map(({ args }) => args.releaseId);

  const releases = await Release.find(
    { _id: { $in: releaseIds } },
    "artistName artwork releaseTitle trackList._id trackList.trackTitle",
    { lean: true }
  ).exec();

  const ids = purchases.map(({ args }) => args.editionId);
  const accounts = Array(ids.length).fill(account);
  const balances = await gridFireContract.balanceOfBatch(accounts, ids);

  const editions = balances.map((balance, index) => ({
    _id: purchases[index].transactionHash,
    balance,
    id: ids[index],
    paid: purchases[index].args.amountPaid,
    release: releases.find(({ _id }) => _id.toString() === releaseIds[index]), // As there could be duplicate releaseIds, the db results length may not match releaseIds array.
    transaction: { transactionHash: purchases[index].transactionHash }
  }));

  return editions;
};

export {
  getDaiContract,
  getGridFireContract,
  getGridFireEdition,
  getGridFireEditionsByReleaseId,
  getGridFireEditionUris,
  getProvider,
  getTransaction,
  getUserGridFireEditions
};
