import { notifyUser } from "@gridfire/events/controllers/notifyUser";
import Logger from "@gridfire/shared/logger";
import Approval from "@gridfire/shared/models/Approval";
import User from "@gridfire/shared/models/User";
import { NotificationType } from "@gridfire/shared/types";
import { AddressLike, EventLog } from "ethers";

const logger = new Logger("onDaiApproval");

const onDaiApproval = async (
  owner: AddressLike,
  spender: AddressLike,
  value: bigint,
  event: EventLog & { logIndex: string }
) => {
  const { blockNumber, logIndex, transactionHash } = event;
  logger.info(`DAI approval from ${owner} for value ${value}.`);

  User.findOne({ account: owner })
    .lean()
    .then(user => {
      if (user) {
        const userId = user._id.toString();
        notifyUser(userId.toString(), { type: NotificationType.Approval, userId });
      }
    });

  Approval.updateOne(
    { logIndex, transactionHash },
    {
      $setOnInsert: {
        blockNumber,
        logIndex,
        owner,
        spender,
        transactionHash,
        value: value.toString()
      }
    },
    { upsert: true }
  ).exec();
};

export default onDaiApproval;
