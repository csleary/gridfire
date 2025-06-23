import { notifyUser } from "@gridfire/events/controllers/notifyUser";
import { validatePurchase } from "@gridfire/events/controllers/release";
import { recordSale } from "@gridfire/events/controllers/sale";
import Logger from "@gridfire/shared/logger";
import Activity from "@gridfire/shared/models/Activity";
import { NotificationType } from "@gridfire/shared/types/index";
import { BytesLike, decodeBytes32String, formatEther, getAddress } from "ethers";

const logger = new Logger("onPurchase");

const onPurchase = async (
  buyerAddress: string,
  artistAddress: string,
  releaseIdBytes: BytesLike,
  userIdBytes: BytesLike,
  amountPaid: bigint,
  artistShare: bigint,
  platformFee: bigint,
  event: any
) => {
  try {
    const daiPaid = formatEther(amountPaid);
    const releaseId = decodeBytes32String(releaseIdBytes);
    const userId = decodeBytes32String(userIdBytes);
    logger.info(`User ${userId} paid ${daiPaid} DAI for release ${releaseId}.`);
    const transactionReceipt = await event.getTransactionReceipt();
    const { transactionHash } = transactionReceipt;

    const { release, releaseTitle, type } = await validatePurchase({
      amountPaid,
      artistAddress,
      transactionHash,
      releaseId,
      userId
    });

    const sale = await recordSale({
      amountPaid,
      artistAddress: getAddress(artistAddress),
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

export default onPurchase;
