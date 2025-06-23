import { notifyUser } from "@gridfire/events/controllers/notifyUser";
import { recordSale } from "@gridfire/events/controllers/sale";
import Logger from "@gridfire/shared/logger";
import Activity from "@gridfire/shared/models/Activity";
import Release from "@gridfire/shared/models/Release";
import { SaleType } from "@gridfire/shared/models/Sale";
import User from "@gridfire/shared/models/User";
import { NotificationType } from "@gridfire/shared/types/index";
import { BytesLike, decodeBytes32String, formatEther, getAddress } from "ethers";

const logger = new Logger("onPurchaseEdition");

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
    const daiPaid = formatEther(amountPaid);
    const releaseId = decodeBytes32String(releaseIdBytes);
    const buyerAddressNormalised = getAddress(buyerAddress);
    const buyerUser = await User.findOne({ account: buyerAddressNormalised }, "_id").exec();

    if (!buyerUser) {
      throw new Error(`Buyer user not found. Address: ${buyerAddressNormalised}`);
    }

    const userId = buyerUser._id.toString();
    const id = editionId.toString();
    logger.info(`User ${userId} paid ${daiPaid} DAI to ${artistAddress} for Edition ${id} (${releaseId}).`);
    const release = await Release.findById(releaseId, "artist artistName releaseTitle user").exec();

    if (!release) {
      throw new Error(`Release ${releaseId} not found.`);
    }

    const transactionReceipt = await event.getTransactionReceipt();

    const sale = await recordSale({
      amountPaid,
      artistAddress: getAddress(artistAddress),
      artistShare,
      platformFee,
      releaseId,
      transactionReceipt,
      type: SaleType.Edition,
      userId
    });

    const { artist: artistId, artistName, releaseTitle, user: artistUser } = release.toJSON();
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
