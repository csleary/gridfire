import { AddressLike, BytesLike, decodeBytes32String, formatEther } from "ethers";
import Activity from "gridfire-web3-events/models/Activity.js";
import { NotificationType } from "gridfire-web3-events/types/index.js";
import logger from "gridfire-web3-events/controllers/logger.js";
import { notifyUser } from "gridfire-web3-events/controllers/notifyUser.js";
import { updateEditionStatus } from "gridfire-web3-events/controllers/edition.js";

const timeZone = "Europe/Amsterdam";

const onEditionMinted = async (
  releaseIdBytes: BytesLike,
  artist: AddressLike,
  objectIdBytes: BytesLike,
  editionId: bigint,
  amount: bigint,
  price: bigint
) => {
  try {
    const date = new Date().toLocaleString("en-UK", { timeZone });
    const releaseId = decodeBytes32String(releaseIdBytes);

    logger.info(
      `${date}: Edition minted by ${artist} for release ${releaseId} (qty.: ${amount}, DAI: ${formatEther(price)}).`
    );

    const decodedObjectId = decodeBytes32String(objectIdBytes);
    const edition = await updateEditionStatus(releaseId, decodedObjectId, editionId.toString());

    if (!edition) {
      throw new Error(`Edition ${decodedObjectId} not found. (Release ${releaseId}`);
    }

    const { user, artist: artistId } = edition.release;
    const userId = user.toString();
    notifyUser(userId, { editionId: decodedObjectId.toString(), type: NotificationType.Mint, userId });
    Activity.mint(artistId.toString(), editionId.toString());
  } catch (error) {
    logger.error(error);
  }
};

export default onEditionMinted;
