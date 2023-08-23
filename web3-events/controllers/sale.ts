import { RecordSaleParams } from "gridfire-web3-events/types/index.js";
import { ISale } from "gridfire-web3-events/models/Sale.js";
import mongoose from "mongoose";

const { Sale } = mongoose.models;

const recordSale = async ({
  amountPaid,
  artistShare,
  platformFee,
  releaseId,
  transactionReceipt,
  type,
  userId
}: RecordSaleParams): Promise<ISale> => {
  const paid = amountPaid.toString();
  const { from: buyer, status, transactionHash } = transactionReceipt;

  if (status !== "0x1") {
    throw new Error(`Transaction failed. Status: ${status}. Hash: ${transactionHash}.`);
  }

  const saleExists = await Sale.exists({
    paid,
    release: releaseId,
    transactionHash,
    type,
    user: userId
  });

  if (saleExists) {
    throw new Error("This sale has already been recorded.");
  }

  const sale = await Sale.create({
    purchaseDate: Date.now(),
    release: releaseId,
    paid,
    fee: platformFee.toString(),
    netAmount: artistShare.toString(),
    transactionHash,
    type,
    user: userId,
    userAddress: buyer
  });

  return sale;
};

export { recordSale };
