import { ObjectId, Schema, model } from "mongoose";

export enum SaleType {
  Single = "single",
  Album = "album",
  Edition = "edition"
}

export interface ISale {
  _id: ObjectId;
  purchaseDate: Date;
  release: ObjectId;
  paid: string;
  fee: string;
  netAmount: string;
  transaction: object;
  type: SaleType;
  user: ObjectId;
  userAddress: string;
}

const { ObjectId } = Schema.Types;

const saleSchema = new Schema<ISale>({
  purchaseDate: Date,
  release: { type: ObjectId, ref: "Release" },
  paid: { type: String },
  fee: { type: String },
  netAmount: { type: String },
  transaction: { type: Object },
  type: { type: String, enum: SaleType, default: SaleType.Album },
  user: { type: ObjectId, ref: "User" },
  userAddress: { type: String }
});

saleSchema.index({ user: 1, release: 1 });

const Sale = model("Sale", saleSchema, "sales");

export default Sale;
