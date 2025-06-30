import Sale, { ISale } from "@gridfire/shared/models/Sale";
import { RecordSaleParams } from "@gridfire/shared/types/index";

const recordSale = async ({
  amountPaid,
  artistAddress,
  artistShare,
  logIndex,
  platformFee,
  releaseId,
  transactionReceipt,
  type,
  userId
}: RecordSaleParams): Promise<ISale> => {
  const paid = amountPaid.toString();
  const { blockNumber, from: buyer, status, transactionHash } = transactionReceipt;

  if (status !== "0x1") {
    throw new Error(`Transaction failed. Status: ${status}. Hash: ${transactionHash}.`);
  }

  const sale = await Sale.findOneAndUpdate(
    { logIndex, transactionHash },
    {
      $setOnInsert: {
        artistAddress,
        blockNumber: blockNumber.toString(),
        fee: platformFee.toString(),
        logIndex,
        netAmount: artistShare.toString(),
        paid,
        purchaseDate: Date.now(),
        release: releaseId,
        transactionHash,
        type,
        user: userId,
        userAddress: buyer
      }
    },
    { upsert: true, new: true }
  ).exec();

  return sale;
};

export { recordSale };
