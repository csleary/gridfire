import Sale, { ISale } from "@gridfire/shared/models/Sale";
import { RecordSaleParams } from "@gridfire/shared/types/index";

const recordSale = async ({
  amountPaid,
  artistAddress,
  artistShare,
  editionId,
  logIndex,
  platformFee,
  releaseId,
  transactionHash,
  transactionReceipt,
  type,
  userId
}: RecordSaleParams): Promise<ISale> => {
  const paid = amountPaid.toString();
  const { blockNumber, from: buyer } = transactionReceipt;

  if (type === "edition" && !editionId) {
    throw new Error("Edition ID required.");
  }

  const sale = await Sale.findOneAndUpdate(
    { logIndex, transactionHash },
    {
      $setOnInsert: {
        artistAddress,
        blockNumber: blockNumber.toString(),
        editionId: editionId ? editionId.toString() : null,
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
    { new: true, upsert: true }
  ).exec();

  return sale;
};

export { recordSale };
