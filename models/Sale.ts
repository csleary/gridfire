import { Schema, Types, model } from "mongoose";

enum SaleType {
  Single = "single",
  Album = "album",
  Edition = "edition"
}

interface ISale {
  purchaseDate: Date;
  release: Types.ObjectId;
  paid: string;
  fee: string;
  netAmount: string;
  transactionHash: string;
  type: SaleType;
  user: Types.ObjectId;
  userAddress: string;
}

const { ObjectId } = Schema.Types;

const saleSchema = new Schema<ISale>({
  purchaseDate: Date,
  release: { type: ObjectId, ref: "Release" },
  paid: { type: String },
  fee: { type: String },
  netAmount: { type: String },
  transactionHash: { type: String },
  type: { type: String, enum: SaleType, default: SaleType.Album },
  user: { type: ObjectId, ref: "User" },
  userAddress: { type: String }
});

saleSchema.index({ user: 1, release: 1 });

const Sale = model<ISale>("Sale", saleSchema, "sales");

export default Sale;
