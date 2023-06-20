import {
  BytesLike,
  Contract,
  ContractEventPayload,
  decodeBytes32String,
  formatEther,
  getAddress,
  getDefaultProvider
} from "ethers";
import { ActivityModel } from "gridfire-web3-events/types/index.js";
import { NotificationType } from "gridfire-web3-events/types/index.js";
import gridFireEditionsABI from "gridfire-web3-events/controllers/gridFireEditionsABI.js";
import gridFirePaymentABI from "gridfire-web3-events/controllers/gridFirePaymentABI.js";
import logger from "gridfire-web3-events/controllers/logger.js";
import mongoose from "mongoose";
import { notifyUser } from "gridfire-web3-events/controllers/notifyUser.js";
import { recordSale } from "gridfire-web3-events/controllers/sale.js";
import { updateEditionStatus } from "gridfire-web3-events/controllers/edition.js";
import { validatePurchase } from "gridfire-web3-events/controllers/release.js";

const { GRIDFIRE_EDITIONS_ADDRESS = "", GRIDFIRE_PAYMENT_ADDRESS = "", NETWORK_URL, NETWORK_KEY } = process.env;
const { Activity, Release, User } = mongoose.models as { Activity: ActivityModel; Release: any; User: any };
const timeZone = "Europe/Amsterdam";

const getProvider = () => {
  return getDefaultProvider(`${NETWORK_URL}/${NETWORK_KEY}`);
};

const getGridFireEditionsContract = () => {
  const provider = getProvider();
  return new Contract(GRIDFIRE_EDITIONS_ADDRESS, gridFireEditionsABI, provider);
};
const getGridFirePaymentContract = () => {
  const provider = getProvider();
  return new Contract(GRIDFIRE_PAYMENT_ADDRESS, gridFirePaymentABI, provider);
};

const onEditionMinted = async (
  releaseIdBytes: BytesLike,
  artist: string,
  objectIdBytes: BytesLike,
  editionId: bigint
) => {
  try {
    const date = new Date().toLocaleString("en-UK", { timeZone });
    const releaseId = decodeBytes32String(releaseIdBytes);
    logger.info(`(${date}) Edition minted by address: ${artist} for releaseId ${releaseId}.`);
    const decodedObjectId = decodeBytes32String(objectIdBytes);
    const edition = await updateEditionStatus(releaseId, decodedObjectId, editionId.toString());
    const { user: userId, artist: artistId } = edition?.release || {};
    notifyUser(userId, { editionId: decodedObjectId.toString(), type: NotificationType.Mint, userId });
    Activity.mint(artistId, editionId.toString());
  } catch (error) {
    logger.error(error);
  }
};

const onPurchase = async (
  buyerAddress: string,
  artistAddress: string,
  releaseIdBytes: BytesLike,
  userIdBytes: BytesLike,
  amountPaid: bigint,
  artistShare: bigint,
  platformFee: bigint,
  event: ContractEventPayload
) => {
  try {
    const date = new Date().toLocaleString("en-UK", { timeZone });
    const daiPaid = formatEther(amountPaid);
    const releaseId = decodeBytes32String(releaseIdBytes);
    const userId = decodeBytes32String(userIdBytes);
    logger.info(`(${date}) User ${userId} paid ${daiPaid} DAI for release ${releaseId}.`);
    const transactionReceipt = await event.getTransactionReceipt();
    const { hash: transactionHash } = transactionReceipt;

    const { release, releaseTitle, type } = await validatePurchase({
      amountPaid,
      artistAddress,
      transactionHash,
      releaseId,
      userId
    });

    const sale = await recordSale({
      amountPaid,
      artistShare,
      platformFee,
      releaseId,
      transactionReceipt,
      type,
      userId
    });

    const { artist: artistId, artistName, user: artistUser } = release;
    const artistUserId = artistUser._id.toString();

    Activity.sale({
      artist: artistId.toString(),
      release: releaseId,
      sale: sale._id.toString(),
      user: userId
    });

    // Notify user of successful purchase.
    notifyUser(userId, { artistName, releaseTitle, type: NotificationType.Purchase, userId });

    // Notify artist of sale.
    notifyUser(artistUserId, {
      artistName,
      artistShare: formatEther(artistShare),
      buyerAddress,
      platformFee: formatEther(platformFee),
      releaseTitle,
      type: NotificationType.Sale,
      userId: artistUserId
    });
  } catch (error) {
    logger.error(error);
  }
};

const onPurchaseEdition = async (
  buyerAddress: string,
  artistAddress: string,
  editionId: bigint,
  amountPaid: bigint,
  artistShare: bigint,
  platformFee: bigint,
  releaseIdBytes: BytesLike,
  event: ContractEventPayload
) => {
  try {
    const date = new Date().toLocaleString("en-UK", { timeZone });
    const daiPaid = formatEther(amountPaid);
    const releaseId = decodeBytes32String(releaseIdBytes);
    const buyerAddressNormalised = getAddress(buyerAddress);
    const buyerUser = await User.findOne({ account: buyerAddressNormalised }, "_id", { lean: true }).exec();

    if (!buyerUser) {
      throw new Error(`Buyer user not found. Address: ${buyerAddressNormalised}`);
    }

    const userId = buyerUser._id.toString();
    const id = editionId.toString();
    logger.info(`(${date}) User ${userId} paid ${daiPaid} DAI to ${artistAddress} for Edition ${id} (${releaseId}).`);
    const release = await Release.findById(releaseId, "artist artistName releaseTitle user", { lean: true }).exec();
    const transactionReceipt = await event.getTransactionReceipt();

    const sale = await recordSale({
      amountPaid,
      artistShare,
      platformFee,
      releaseId,
      transactionReceipt,
      type: "edition",
      userId
    });

    const { artist: artistId, artistName, releaseTitle, user: artistUser } = release;
    const artistUserId = artistUser.toString();

    Activity.sale({
      artist: artistId.toString(),
      editionId: id,
      release: releaseId,
      sale: sale._id.toString(),
      user: userId
    });

    // Notify user of successful purchase.
    notifyUser(userId, { artistName, releaseTitle, type: NotificationType.PurchaseEdition, userId });

    // Notify artist of sale.
    notifyUser(artistUserId, {
      artistName,
      artistShare: formatEther(artistShare),
      buyerAddress,
      platformFee: formatEther(platformFee),
      releaseTitle,
      type: NotificationType.Sale,
      userId: artistUserId
    });
  } catch (error) {
    logger.error(error);
  }
};

export { getGridFireEditionsContract, getGridFirePaymentContract, onEditionMinted, onPurchase, onPurchaseEdition };
