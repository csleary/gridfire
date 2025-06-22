import { ISale } from "@gridfire/shared/models/Sale.js";
import { RecordSaleParams } from "@gridfire/shared/types/index.js";
import mongoose from "mongoose";

const { Sale } = mongoose.models;

const recordSale = async ({
  amountPaid,
  artistAddress,
  artistShare,
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
    { transactionHash },
    {
      $setOnInsert: {
        artistAddress,
        blockNumber: blockNumber.toString(),
        fee: platformFee.toString(),
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
