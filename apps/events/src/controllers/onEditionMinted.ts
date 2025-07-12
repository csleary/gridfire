import { updateEditionStatus } from "@gridfire/events/controllers/edition";
import { notifyUser } from "@gridfire/events/controllers/notifyUser";
import Logger from "@gridfire/shared/logger";
import Activity from "@gridfire/shared/models/Activity";
import Minted from "@gridfire/shared/models/Minted";
import { NotificationType } from "@gridfire/shared/types";
import { AddressLike, BytesLike, decodeBytes32String, EventLog, formatEther } from "ethers";

const logger = new Logger("onEditionMinted");

const onEditionMinted = async (
  releaseIdBytes: BytesLike,
  artist: AddressLike,
  objectIdBytes: BytesLike,
  editionId: bigint,
  amount: bigint,
  price: bigint,
  event: EventLog & { logIndex: string }
) => {
  try {
    const releaseId = decodeBytes32String(releaseIdBytes);
    logger.info(`Edition minted by ${artist} for release ${releaseId} (qty.: ${amount}, DAI: ${formatEther(price)}).`);
    const decodedObjectId = decodeBytes32String(objectIdBytes);
    const edition = await updateEditionStatus(releaseId, decodedObjectId, editionId.toString());

    if (!edition) {
      throw new Error(`[release ${releaseId}] Edition ${decodedObjectId} not found.`);
    }

    const { artist: artistId, user } = edition.release;
    const userId = user.toString();
    notifyUser(userId, { editionId: decodedObjectId.toString(), type: NotificationType.Mint, userId });
    const { blockNumber, logIndex, transactionHash } = event;

    await Minted.updateOne(
      { logIndex, transactionHash },
      {
        $setOnInsert: {
          amount: amount.toString(),
          artistAddress: artist,
          blockNumber,
          editionId: editionId.toString(),
          logIndex,
          objectId: decodedObjectId,
          price: price.toString(),
          releaseId,
          transactionHash
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
