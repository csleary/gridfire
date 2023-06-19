import "gridfire-web3-events/models/Edition.js";
import "gridfire-web3-events/models/Release.js";
import "gridfire-web3-events/models/Sale.js";
import "gridfire-web3-events/models/User.js";
import { Contract, decodeBytes32String, formatEther, getAddress, getDefaultProvider, parseEther } from "ethers";
import gridFireEditionsABI from "gridfire-web3-events/controllers/gridFireEditionsABI.js";
import gridFirePaymentABI from "gridfire-web3-events/controllers/gridFirePaymentABI.js";
import logger from "gridfire-web3-events/controllers/logger.js";
import mongoose from "mongoose";
import { publishToQueue } from "gridfire-web3-events/controllers/amqp/index.js";
import { updateEditionStatus } from "gridfire-web3-events/controllers/edition.js";

const { GRIDFIRE_EDITIONS_ADDRESS, GRIDFIRE_PAYMENT_ADDRESS, NETWORK_URL, NETWORK_KEY } = process.env;
const { Activity, Release, Sale, User } = mongoose.models;
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

const onEditionMinted = async (releaseIdBytes, artist, objectIdBytes, editionId) => {
  try {
    const date = new Date().toLocaleString("en-UK", { timeZone });
    const releaseId = decodeBytes32String(releaseIdBytes);
    logger.info(`(${date}) Edition minted by address: ${artist} for releaseId ${releaseId}.`);
    const decodedId = decodeBytes32String(objectIdBytes);
    const edition = await updateEditionStatus(releaseId, decodedId);
    const { user: userId, artist: artistId } = edition?.release || {};
    publishToQueue("user", userId.toString(), { editionId: decodedId.toString(), type: "mintedEvent", userId });
    Activity.mint(artistId, editionId.toString());
  } catch (error) {
    logger.error(error);
  }
};

const onPurchase = async (
  buyerAddress,
  artistAddress,
  releaseIdBytes,
  userIdBytes,
  amountPaid,
  artistShare,
  platformFee,
  event
) => {
  try {
    const date = new Date().toLocaleString("en-UK", { timeZone });
    const daiPaid = formatEther(amountPaid);
    const releaseId = decodeBytes32String(releaseIdBytes);
    const userId = decodeBytes32String(userIdBytes);
    logger.info(`(${date}) User ${userId} paid ${daiPaid} DAI for release ${releaseId}.`);

    let price;
    let releaseTitle;
    let type = "album";

    // Check if the purchase is for a single or an album.
    let release = await Release.findOne({ "trackList._id": releaseId }, "artist artistName trackList.$", { lean: true })
      .populate({ path: "user", model: User, options: { lean: true }, select: "paymentAddress" })
      .exec();

    if (release) {
      const [track] = release.trackList;
      releaseTitle = track.trackTitle;
      ({ price } = track);
      type = "single";
    } else {
      release = await Release.findById(releaseId, "artist artistName price releaseTitle", { lean: true })
        .populate({ path: "user", model: User, options: { lean: true }, select: "paymentAddress" })
        .exec();

      ({ price, releaseTitle } = release);
    }

    const { artistName, user: artistUser } = release;

    if (getAddress(artistUser.paymentAddress) !== getAddress(artistAddress)) {
      throw new Error("Payment address and release artist address do not match.");
    }

    if (amountPaid < parseEther(price.toString())) {
      throw new Error("The amount paid is lower than the release price.");
    }

    if (await Sale.exists({ release: releaseId, user: userId })) {
      throw new Error("The buyer already owns this release.");
    }

    const transactionReceipt = await event.getTransactionReceipt();
    const { gasUsed, cumulativeGasUsed, gasPrice, ...restTxReceipt } = transactionReceipt;
    const { from: buyer, status } = restTxReceipt;
    const bigIntValues = { gasUsed, cumulativeGasUsed, gasPrice };
    const bigIntToString = (prev, [key, value]) => ({ ...prev, [key]: value.toString() });
    const bigIntValuesAsString = Object.entries(bigIntValues).reduce(bigIntToString, {});

    if (status === 1) {
      const sale = await Sale.create({
        purchaseDate: Date.now(),
        release: releaseId,
        paid: amountPaid.toString(),
        fee: platformFee.toString(),
        netAmount: artistShare.toString(),
        transaction: { ...restTxReceipt, ...bigIntValuesAsString },
        type,
        user: userId,
        userAddress: buyer
      }).catch(error => {
        if (error.code === 11000) throw new Error("This sale has already been recorded.");
        logger.error(error);
      });

      Activity.sale({
        artist: release.artist.toString(),
        release: releaseId,
        sale: sale._id.toString(),
        user: userId
      });

      // Notify user of successful purchase.
      publishToQueue("user", userId, { artistName, releaseTitle, type: "purchaseEvent", userId });
      const artistUserId = artistUser._id.toString();

      // Notify artist of sale.
      publishToQueue("user", artistUserId, {
        artistName,
        artistShare: formatEther(artistShare),
        buyerAddress,
        platformFee: formatEther(platformFee),
        releaseTitle,
        type: "saleEvent",
        userId: artistUserId
      });
    }
  } catch (error) {
    logger.error("🔴 Purchase error:", error);
  }
};

const onPurchaseEdition = async (
  buyerAddress,
  artistAddress,
  editionId,
  amountPaid,
  artistShare,
  platformFee,
  releaseIdBytes,
  event
) => {
  try {
    const buyerAddressNormalised = getAddress(buyerAddress);
    const buyerUser = await User.findOne({ account: buyerAddressNormalised }, "_id", { lean: true }).exec();
    if (!buyerUser) throw new Error(`Buyer user not found. Address: ${buyerAddressNormalised}`);
    const releaseId = decodeBytes32String(releaseIdBytes);
    const userId = buyerUser._id.toString();
    const date = new Date().toLocaleString("en-UK", { timeZone: "Europe/Amsterdam" });
    const daiPaid = formatEther(amountPaid);
    const id = editionId.toString();

    logger.info(
      `(${date}) User ${userId} paid ${daiPaid} DAI for GridFire Edition (${id}), release ${releaseId}, artist address: ${artistAddress}.`
    );

    const release = await Release.findById(releaseId, "artist artistName releaseTitle", { lean: true })
      .populate({ path: "user", model: User, options: { lean: true }, select: "paymentAddress" })
      .exec();

    const { artistName, releaseTitle, user: artistUser } = release;
    const transactionReceipt = await event.getTransactionReceipt();
    const { gasUsed, cumulativeGasUsed, gasPrice, ...restTxReceipt } = transactionReceipt;
    const { from: buyer, status } = restTxReceipt;
    const bigIntValues = { gasUsed, cumulativeGasUsed, gasPrice };
    const bigIntToString = (prev, [key, value]) => ({ ...prev, [key]: value.toString() });
    const bigIntValuesAsString = Object.entries(bigIntValues).reduce(bigIntToString, {});

    if (status === 1) {
      const sale = await Sale.create({
        purchaseDate: Date.now(),
        release: releaseId,
        paid: amountPaid.toString(),
        fee: platformFee.toString(),
        netAmount: artistShare.toString(),
        transaction: { ...restTxReceipt, ...bigIntValuesAsString },
        type: "edition",
        user: userId,
        userAddress: buyer
      }).catch(error => {
        if (error.code === 11000) throw new Error("This sale has already been recorded.");
        logger.error(error);
      });

      Activity.sale({
        artist: release.artist.toString(),
        editionId: id,
        release: releaseId,
        sale: sale._id.toString(),
        user: userId
      });

      // Notify user of successful purchase.
      publishToQueue("user", userId, { artistName, releaseTitle, type: "purchaseEditionEvent", userId });
      const artistUserId = artistUser._id.toString();

      // Notify artist of sale.
      publishToQueue("user", artistUserId, {
        artistName,
        artistShare: formatEther(artistShare),
        buyerAddress,
        platformFee: formatEther(platformFee),
        releaseTitle,
        type: "saleEvent",
        userId: artistUserId
      });
    }
  } catch (error) {
    logger.error("[Web3 Events] 🔴 Edition Purchase error:", error);
  }
};

export { getGridFireEditionsContract, getGridFirePaymentContract, onEditionMinted, onPurchase, onPurchaseEdition };
