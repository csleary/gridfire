import { notifyUser } from "@gridfire/events/controllers/notifyUser";
import { validatePurchase } from "@gridfire/events/controllers/release";
import { recordSale } from "@gridfire/events/controllers/sale";
import Logger from "@gridfire/shared/logger";
import Activity from "@gridfire/shared/models/Activity";
import { NotificationType } from "@gridfire/shared/types";
import { BytesLike, decodeBytes32String, EventLog, formatEther, getAddress } from "ethers";

const logger = new Logger("onPurchase");

const onPurchase = async (
  buyerAddress: string,
  artistAddress: string,
  releaseIdBytes: BytesLike,
  userIdBytes: BytesLike,
  amountPaid: bigint,
  artistShare: bigint,
  platformFee: bigint,
  event: EventLog & { logIndex: string }
) => {
  try {
    const daiPaid = formatEther(amountPaid);
    const releaseId = decodeBytes32String(releaseIdBytes);
    const userId = decodeBytes32String(userIdBytes);
    logger.info(`User ${userId} paid ${daiPaid} DAI for release ${releaseId}.`);
    const transactionReceipt = await event.getTransactionReceipt();
    const { logIndex } = event;

    const { release, releaseTitle, type } = await validatePurchase({
      amountPaid,
      artistAddress,
      releaseId
    });

    const sale = await recordSale({
      amountPaid,
      artistAddress: getAddress(artistAddress),
      artistShare,
      logIndex,
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
