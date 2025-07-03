import { notifyUser } from "@gridfire/events/controllers/notifyUser";
import Logger from "@gridfire/shared/logger";
import Claim from "@gridfire/shared/models/Claim";
import User from "@gridfire/shared/models/User";
import { NotificationType } from "@gridfire/shared/types";
import { AddressLike, EventLog, formatEther } from "ethers";

const logger = new Logger("onDaiApproval");

const onBalanceClaim = async (artist: AddressLike, value: bigint, event: EventLog & { logIndex: string }) => {
  const { blockNumber, logIndex, transactionHash } = event;
  logger.info(`Artist ${artist} claimed ${formatEther(value)}.`);

  User.findOne({ address: artist })
    .lean()
    .then(user => {
      if (user) {
        const userId = user._id.toString();
        notifyUser(userId.toString(), { type: NotificationType.Claim, userId });
      }
    });

  await Claim.updateOne(
    { logIndex, transactionHash },
    {
      $setOnInsert: {
        artist,
        blockNumber,
        logIndex,
        transactionHash,
        value: value.toString()
      }
    },
    { upsert: true }
  ).exec();
};

export default onBalanceClaim;
