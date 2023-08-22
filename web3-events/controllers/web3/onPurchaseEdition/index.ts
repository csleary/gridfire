import { BytesLike, decodeBytes32String, formatEther, getAddress } from "ethers";
import Activity from "gridfire-web3-events/models/Activity.js";
import { IRelease } from "gridfire-web3-events/models/Release.js";
import { IUser } from "gridfire-web3-events/models/User.js";
import { NotificationType } from "gridfire-web3-events/types/index.js";
import { SaleType } from "gridfire-web3-events/models/Sale.js";
import logger from "gridfire-web3-events/controllers/logger.js";
import mongoose from "mongoose";
import { notifyUser } from "gridfire-web3-events/controllers/notifyUser.js";
import { recordSale } from "gridfire-web3-events/controllers/sale.js";

const { Release, User } = mongoose.models;
const timeZone = "Europe/Amsterdam";

const onPurchaseEdition = async (
  buyerAddress: string,
  artistAddress: string,
  editionId: bigint,
  amountPaid: bigint,
  artistShare: bigint,
  platformFee: bigint,
  releaseIdBytes: BytesLike,
  event: any
) => {
  try {
    const date = new Date().toLocaleString("en-UK", { timeZone });
    const daiPaid = formatEther(amountPaid);
    const releaseId = decodeBytes32String(releaseIdBytes);
    const buyerAddressNormalised = getAddress(buyerAddress);

    const buyerUser: Pick<IUser, "_id"> = await User.findOne({ account: buyerAddressNormalised }, "_id", {
      lean: true
    }).exec();

    if (!buyerUser) {
      throw new Error(`Buyer user not found. Address: ${buyerAddressNormalised}`);
    }

    const userId = buyerUser._id.toString();
    const id = editionId.toString();
    logger.info(`(${date}) User ${userId} paid ${daiPaid} DAI to ${artistAddress} for Edition ${id} (${releaseId}).`);

    const release: Pick<IRelease, "_id" | "artist" | "artistName" | "releaseTitle" | "user"> = await Release.findById(
      releaseId,
      "artist artistName releaseTitle user",
      { lean: true }
    ).exec();

    const transactionReceipt = await event.getTransactionReceipt();

    const sale = await recordSale({
      amountPaid,
      artistShare,
      platformFee,
      releaseId,
      transactionReceipt,
      type: SaleType.Edition,
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

export default onPurchaseEdition;
