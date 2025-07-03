import { GridfireEditions, GridfirePayment } from "@gridfire/api/controllers/imports/contracts";
import provider from "@gridfire/api/controllers/web3/provider";
import daiAbi from "@gridfire/shared/abi/dai";
import Edition, { IEdition } from "@gridfire/shared/models/Edition";
import Release from "@gridfire/shared/models/Release";
import User from "@gridfire/shared/models/User";
import { Contract, Interface, getAddress, getDefaultProvider, resolveAddress } from "ethers";
import { FilterQuery, ObjectId } from "mongoose";
import assert from "node:assert/strict";

const {
  DAI_CONTRACT_ADDRESS,
  GRIDFIRE_EDITIONS_ADDRESS,
  GRIDFIRE_PAYMENT_ADDRESS,
  MAINNET_NETWORK_KEY,
  MAINNET_NETWORK_URL
} = process.env;

const { abi: gridfireEditionsABI } = GridfireEditions;
const { abi: gridfirePaymentABI } = GridfirePayment;

assert(GRIDFIRE_EDITIONS_ADDRESS, "GRIDFIRE_EDITIONS_ADDRESS env var not set.");
assert(GRIDFIRE_PAYMENT_ADDRESS, "GRIDFIRE_PAYMENT_ADDRESS env var not set.");
assert(DAI_CONTRACT_ADDRESS, "DAI_CONTRACT_ADDRESS env var not set.");
assert(MAINNET_NETWORK_KEY, "MAINNET_NETWORK_KEY env var not set.");
assert(MAINNET_NETWORK_URL, "MAINNET_NETWORK_URL env var not set.");

const getDaiContract = () => {
  return new Contract(DAI_CONTRACT_ADDRESS, daiAbi, provider);
};

const getGridfireEditionsContract = () => {
  return new Contract(GRIDFIRE_EDITIONS_ADDRESS, gridfireEditionsABI, provider);
};

const getGridfirePaymentContract = () => {
  return new Contract(GRIDFIRE_PAYMENT_ADDRESS, gridfirePaymentABI, provider);
};

const getBlockNumber = async () => {
  const blockNumber = await provider.getBlockNumber();
  return blockNumber;
};

const getGridfireEditionsByReleaseId = async (
  filter: FilterQuery<IEdition>
): Promise<(IEdition & { balance: string })[]> => {
  const editions = await Edition.find(filter).lean();
  const accounts = Array(editions.length).fill(GRIDFIRE_EDITIONS_ADDRESS);
  const ids = editions.map(({ editionId }) => editionId);
  const gridFireEditionsContract = getGridfireEditionsContract();
  const balances: BigInt[] = await gridFireEditionsContract.balanceOfBatch(accounts, ids);
  const balancesMap = balances.reduce((map, balance = 0n, index) => map.set(ids[index], balance.toString()), new Map());
  return editions.map(edition => ({ ...edition, balance: balancesMap.get(edition.editionId) }));
};

const getGridfireEditionUris = async (releaseId: string) => {
  const editions = await Edition.find({ releaseId, status: "minted" }).lean();
  const ids = editions.map(({ editionId }) => editionId);
  const gridFireEditionsContract = getGridfireEditionsContract();
  const uris = Promise.all(ids.map(id => gridFireEditionsContract.uri(id)));
  return uris;
};

const getResolvedAddress = async (address: string) => {
  const mainnetProvider = getDefaultProvider(`${MAINNET_NETWORK_URL}/${MAINNET_NETWORK_KEY}`);
  const resolvedAddress = await resolveAddress(address, mainnetProvider);
  mainnetProvider.provider.destroy();
  return resolvedAddress;
};

const getTransaction = async (txId: string) => {
  const tx = await provider.getTransaction(txId);
  if (!tx) return null;
  const iface = new Interface(gridfireEditionsABI);
  const parsedTx = iface.parseTransaction(tx);
  return parsedTx;
};

const getUserGridfireEditions = async (userId: ObjectId) => {
  const user = await User.findById(userId).exec();
  if (!user) return [];
  const userAccount = getAddress(user.account);
  const allEditions = await Edition.find({ status: "minted" }).populate({ path: "release", model: Release }).lean();
  const editionIds = allEditions.map(({ editionId }) => editionId);
  const accounts = Array(allEditions.length).fill(userAccount);
  const gridFireEditionsContract = getGridfireEditionsContract();
  const balances: bigint[] = await gridFireEditionsContract.balanceOfBatch(accounts, editionIds);
  const inWallet = allEditions.filter((_, i) => balances[i] > 0);
  return inWallet;
};

const setVisibility = async (user: ObjectId, editionId: string, visibility: "hidden" | "visible") => {
  await Edition.updateOne({ editionId, user }, { visibility }).exec();
};

export {
  getBlockNumber,
  getDaiContract,
  getGridfireEditionUris,
  getGridfireEditionsByReleaseId,
  getGridfireEditionsContract,
  getGridfirePaymentContract,
  getResolvedAddress,
  getTransaction,
  getUserGridfireEditions,
  setVisibility
};
