import {
  BytesLike,
  Contract,
  EventLog,
  Interface,
  encodeBytes32String,
  getAddress,
  getDefaultProvider,
  resolveAddress
} from "ethers";
import Edition, { IEdition } from "gridfire/models/Edition.js";
import { FilterQuery, ObjectId } from "mongoose";
import Release, { IRelease } from "gridfire/models/Release.js";
import User, { IUser } from "gridfire/models/User.js";
import { AddressLike } from "ethers";
import GridfireEditions from "gridfire/hardhat/artifacts/contracts/GridfireEditions.sol/GridfireEditions.json" assert { type: "json" };
import GridfirePayment from "gridfire/hardhat/artifacts/contracts/GridfirePayment.sol/GridfirePayment.json" assert { type: "json" };
import assert from "assert/strict";
import daiAbi from "gridfire/controllers/web3/dai.js";
import provider from "./providers/index.js";

const {
  GRIDFIRE_EDITIONS_ADDRESS,
  GRIDFIRE_PAYMENT_ADDRESS,
  DAI_CONTRACT_ADDRESS,
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

interface MintedEdition {
  amount: string;
  artist: string;
  balance: BigInt;
  createdAt: string;
  editionId: string;
  metadata: any;
  price: string;
  releaseId: string;
  visibility: "hidden" | "visible";
}

const getBlockNumber = async () => {
  const blockNumber = await provider.getBlockNumber();
  return blockNumber;
};

const getGridfireEditionsByReleaseId = async (filter: FilterQuery<IEdition>) => {
  const { release: releaseId } = filter;
  const gridFireEditionsContract = getGridfireEditionsContract();
  const offChainEditions = await Edition.find(filter, "createdAt editionId metadata visibility", { lean: true }).exec();
  const release = await Release.findById(releaseId, "user", { lean: true }).populate<{ user: IUser }>("user").exec();

  if (!release) {
    console.warn(`Release ${releaseId} not found.`);
    return [];
  }

  const artistAccount: AddressLike = getAddress(release.user.account);
  const releaseIdBytes: BytesLike = encodeBytes32String(releaseId);
  const mintFilter = gridFireEditionsContract.filters.EditionMinted(releaseIdBytes, artistAccount);
  const mintEvents = (await gridFireEditionsContract.queryFilter(mintFilter, 0n, 499n)) as EventLog[];

  const editions: MintedEdition[] = mintEvents.map(({ args }: EventLog) => {
    const { amount, editionId, artist, price } = args;

    return {
      amount: amount.toString(),
      balance: 0n,
      createdAt: new Date().toISOString(),
      editionId: editionId.toString(),
      artist,
      metadata: {},
      price: price.toString(),
      releaseId,
      visibility: "visible"
    };
  });

  const accounts = Array(editions.length).fill(GRIDFIRE_EDITIONS_ADDRESS);
  const ids = editions.map(({ editionId }) => editionId);
  const balances: BigInt[] = await gridFireEditionsContract.balanceOfBatch(accounts, ids);
  const balancesMap = balances.reduce((map, balance, index) => map.set(ids[index], balance.toString()), new Map());
  const offChainEditionsMap = offChainEditions.reduce((map, edition) => map.set(edition.editionId, edition), new Map());
  const matchedOffChain = ({ editionId }: { editionId: string }) => offChainEditionsMap.has(editionId);

  // Filter out editions we don't have in the db, add balances and metadata for convenience.
  return editions.filter(matchedOffChain).map(edition => {
    const { editionId } = edition;
    const { createdAt, metadata, visibility } = offChainEditionsMap.get(editionId);
    edition.createdAt = createdAt;
    edition.balance = balancesMap.get(editionId);
    edition.metadata = metadata;
    edition.visibility = visibility;
    return edition;
  });
};

const getGridfireEditionUris = async (releaseId: string) => {
  const gridFireEditionsContract = getGridfireEditionsContract();
  const release = await Release.findById(releaseId, "user", { lean: true }).populate<{ user: IUser }>("user").exec();
  if (!release) return [];
  const artistAccount = getAddress(release.user.account);
  const releaseIdBytes = encodeBytes32String(releaseId);
  const mintFilter = gridFireEditionsContract.filters.EditionMinted(releaseIdBytes, artistAccount);
  const mintEvents = (await gridFireEditionsContract.queryFilter(mintFilter, 0n, 499n)) as EventLog[];
  const ids = mintEvents.map(({ args }) => args.editionId);
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

  if (!user) {
    console.warn(`User ${userId} not found.`);
    return [];
  }

  const userAccount = getAddress(user.account);
  const gridFireEditionsContract = getGridfireEditionsContract();

  // Get all editions sent to user (may not still be in possession, so check balances).
  const editionsTransferFilter = gridFireEditionsContract.filters.TransferSingle(null, null, userAccount);
  const transfers = (await gridFireEditionsContract.queryFilter(editionsTransferFilter, 0n, 499n)) as EventLog[];
  if (!transfers.length) return []; // User account has never received anything, so we can return early.
  const transferEditionIds: bigint[] = transfers.map(({ args }) => args.id);
  const accounts: AddressLike[] = Array(transferEditionIds.length).fill(userAccount);
  const balances: bigint[] = await gridFireEditionsContract.balanceOfBatch(accounts, transferEditionIds);
  const transferEditions = transfers.map((transfer, index) => ({ ...transfer, balance: balances[index] }));
  const inPossession = transferEditions.filter(({ balance }) => balance !== 0n);
  const inPossessionIds: string[] = inPossession.map(({ args }) => args.id.toString());

  // From these IDs, fetch minted Editions that we have recorded off-chain, for release info.
  const filter = { editionId: { $in: inPossessionIds }, status: "minted" };
  const select = "artistName artwork releaseTitle trackList._id trackList.trackTitle user";
  const populateRelease = { path: "release", model: Release, options: { lean: true }, select };
  const populateUser = { path: "user", model: User, options: { lean: true }, select: "account" };

  const mintedEditions = await Edition.find(filter, "-cid", {
    lean: true
  })
    .populate<{ release: IRelease }>(populateRelease)
    .populate<{ user: IUser }>(populateUser)
    .exec();

  // All editions purchased by user (to get amount paid).
  const editions = await Promise.all(
    inPossession.map(async ({ args, balance, transactionHash }) => {
      const edition = mintedEditions.find(({ editionId }) => editionId.toString() === args.id.toString());

      if (!edition) {
        console.warn(`Edition '${args.id}' not found offchain.`);
        return null;
      }

      const artistAccount: AddressLike = getAddress(edition.user.account);

      // Get purchase information for Editions that were purchased directly rather than transferred from a third party.
      const editionsPurchaseFilter = gridFireEditionsContract.filters.PurchaseEdition(userAccount, artistAccount);
      const purchases = (await gridFireEditionsContract.queryFilter(editionsPurchaseFilter, 0n, 499n)) as EventLog[];
      const purchase = purchases.find(p => p.transactionHash === transactionHash) as EventLog;
      const { amountPaid } = purchase.args as unknown as { amountPaid: bigint };
      const paid = amountPaid?.toString();

      return {
        ...edition,
        _id: transactionHash,
        balance: balance.toString(),
        ...(paid != null ? { paid } : {}),
        transactionHash
      };
    })
  );

  return editions.filter(Boolean);
};

const setVisibility = async (user: ObjectId, editionId: string, visibility: "hidden" | "visible") => {
  await Edition.updateOne({ editionId, user }, { visibility }).exec();
};

export {
  getBlockNumber,
  getDaiContract,
  getGridfireEditionsContract,
  getGridfirePaymentContract,
  getGridfireEditionsByReleaseId,
  getGridfireEditionUris,
  getResolvedAddress,
  getTransaction,
  getUserGridfireEditions,
  setVisibility
};
