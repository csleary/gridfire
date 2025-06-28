import { updateEditionStatus } from "@gridfire/events/controllers/edition";
import { notifyUser } from "@gridfire/events/controllers/notifyUser";
import Logger from "@gridfire/shared/logger";
import Activity from "@gridfire/shared/models/Activity";
import Minted from "@gridfire/shared/models/Minted";
import { NotificationType } from "@gridfire/shared/types";
import { AddressLike, BytesLike, decodeBytes32String, formatEther, Log } from "ethers";

const logger = new Logger("onEditionMinted");

const onEditionMinted = async (
  releaseIdBytes: BytesLike,
  artist: AddressLike,
  objectIdBytes: BytesLike,
  editionId: bigint,
  amount: bigint,
  price: bigint,
  event: Log
) => {
  try {
    const releaseId = decodeBytes32String(releaseIdBytes);
    logger.info(`Edition minted by ${artist} for release ${releaseId} (qty.: ${amount}, DAI: ${formatEther(price)}).`);
    const decodedObjectId = decodeBytes32String(objectIdBytes);
    const edition = await updateEditionStatus(releaseId, decodedObjectId, editionId.toString());

    if (!edition) {
      throw new Error(`Edition ${decodedObjectId} not found. (Release ${releaseId}`);
    }

    const { user, artist: artistId } = edition.release;
    const userId = user.toString();
    notifyUser(userId, { editionId: decodedObjectId.toString(), type: NotificationType.Mint, userId });

    // Store 'MintedEdition' event in the db.
    const receipt = await event.getTransactionReceipt();
    const { blockNumber, transactionHash } = receipt as any;

    await Minted.updateOne(
      { transactionHash },
      {
        $setOnInsert: {
          transactionHash,
          blockNumber,
          releaseId,
          artistAddress: artist,
          objectId: decodedObjectId,
          editionId: editionId.toString(),
          amount: amount.toString(),
          price: price.toString()
        }
      },
      { upsert: true }
    ).exec();

    Activity.mint(artistId.toString(), editionId.toString());
  } catch (error) {
    logger.error(error);
  }
};

export default onEditionMinted;
