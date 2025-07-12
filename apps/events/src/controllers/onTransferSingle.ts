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
        from,
        id: id.toString(),
        logIndex,
        operator,
        to,
        transactionHash,
        type: "single",
        value: value.toString()
      }
    },
    { upsert: true }
  ).exec();
};

export default onTransferSingle;
