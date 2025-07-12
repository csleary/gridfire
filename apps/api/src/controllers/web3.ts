import provider from "@gridfire/api/controllers/provider";
import daiAbi from "@gridfire/shared/abi/dai";
import editionsABI from "@gridfire/shared/abi/editions";
import paymentABI from "@gridfire/shared/abi/payment";
import Edition, { IEdition } from "@gridfire/shared/models/Edition";
import Release, { IRelease } from "@gridfire/shared/models/Release";
import Sale, { ISale } from "@gridfire/shared/models/Sale";
import Transfer, { ITransfer } from "@gridfire/shared/models/Transfer";
import User from "@gridfire/shared/models/User";
import { Contract, getAddress, getDefaultProvider, Interface, resolveAddress } from "ethers";
import { FilterQuery, ObjectId } from "mongoose";
import assert from "node:assert/strict";

const {
  DAI_CONTRACT_ADDRESS,
  GRIDFIRE_EDITIONS_ADDRESS,
  GRIDFIRE_PAYMENT_ADDRESS,
  MAINNET_NETWORK_KEY,
  MAINNET_NETWORK_URL
} = process.env;

assert(GRIDFIRE_EDITIONS_ADDRESS, "GRIDFIRE_EDITIONS_ADDRESS env var not set.");
assert(GRIDFIRE_PAYMENT_ADDRESS, "GRIDFIRE_PAYMENT_ADDRESS env var not set.");
assert(DAI_CONTRACT_ADDRESS, "DAI_CONTRACT_ADDRESS env var not set.");
assert(MAINNET_NETWORK_KEY, "MAINNET_NETWORK_KEY env var not set.");
assert(MAINNET_NETWORK_URL, "MAINNET_NETWORK_URL env var not set.");

const getDaiContract = () => {
  return new Contract(DAI_CONTRACT_ADDRESS, daiAbi, provider);
};

const getGridfireEditionsContract = () => {
  return new Contract(GRIDFIRE_EDITIONS_ADDRESS, editionsABI, provider);
};

const getGridfirePaymentContract = () => {
  return new Contract(GRIDFIRE_PAYMENT_ADDRESS, paymentABI, provider);
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
  const balances: bigint[] = await gridFireEditionsContract.balanceOfBatch(accounts, ids);
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
  const iface = new Interface(editionsABI);
  const parsedTx = iface.parseTransaction(tx);
  return parsedTx;
};

type PurchasedAndReceivedEditions =
  | (ISale & { release: IRelease })[]
  | (ITransfer & { editionId: string; release: IRelease })[];

const getUserGridfireEditions = async (userId: ObjectId): Promise<PurchasedAndReceivedEditions> => {
  const user = await User.findById(userId).exec();
  if (!user) return [];
  const userAccount = getAddress(user.account);

  const receivedEditions = await Transfer.aggregate([
    { $match: { to: userAccount } },
    { $lookup: { as: "edition", foreignField: "editionId", from: Edition.collection.name, localField: "id" } },
    { $lookup: { as: "release", foreignField: "_id", from: Release.collection.name, localField: "edition.release" } },
    { $addFields: { editionId: "$id", release: { $first: "$release" } } },
    {
      $project: {
        editionId: 1,
        logIndex: 1,
        paid: { $literal: 0 },
        purchaseDate: "$createdAt",
        release: { _id: 1, artistName: 1, artwork: 1, releaseTitle: 1, "trackList._id": 1, "trackList.trackTitle": 1 },
        transactionHash: 1,
        type: "edition"
      }
    }
  ]).exec();

  const purchasedEditions = await Sale.find(
    { type: "edition", user: userId },
    "editionId logIndex paid purchaseDate transactionHash type",
    { sort: "-purchaseDate" }
  )
    .populate({
      model: Release,
      path: "release",
      select: "artistName artwork releaseTitle trackList._id trackList.trackTitle"
    })
    .lean();

  const allEditions = [...receivedEditions, ...purchasedEditions];
  if (allEditions.length === 0) return [];

  const editionIds = allEditions.map(({ editionId }) => editionId);
  const accounts = Array(allEditions.length).fill(userAccount);
  const gridFireEditionsContract = getGridfireEditionsContract();
  const balances: bigint[] = await gridFireEditionsContract.balanceOfBatch(accounts, editionIds);
  const inWallet = allEditions.filter((_, i) => balances[i] > 0) as unknown as PurchasedAndReceivedEditions;
  return inWallet;
};

const setVisibility = async (user: ObjectId, editionId: string, visibility: "hidden" | "visible") => {
  await Edition.updateOne({ editionId, user }, { visibility }).exec();
};

export {
  getBlockNumber,
  getDaiContract,
  getGridfireEditionsByReleaseId,
  getGridfireEditionsContract,
  getGridfireEditionUris,
  getGridfirePaymentContract,
  getResolvedAddress,
  getTransaction,
  getUserGridfireEditions,
  setVisibility
};
