import Logger from "@gridfire/shared/logger";
import Transfer from "@gridfire/shared/models/Transfer";
import { AddressLike, EventLog, formatEther } from "ethers";

const logger = new Logger("onDaiApproval");

const onTransferSingle = async (
  operator: AddressLike,
  from: AddressLike,
  to: AddressLike,
  id: bigint,
  value: bigint,
  event: EventLog & { logIndex: string }
) => {
  const { blockNumber, logIndex, transactionHash } = event;

  logger.info(
    `Edition ${id.toString()} transferred from ${from} to ${to} by ${operator}. Value: ${formatEther(value)}.`
  );

  await Transfer.updateOne(
    { logIndex, transactionHash },
    {
      $setOnInsert: {
        blockNumber,
        logIndex,
        transactionHash,
        operator,
        from,
        to,
        id: id.toString(),
        value: value.toString(),
        type: "single"
      }
    },
    { upsert: true }
  ).exec();
};

export default onTransferSingle;
