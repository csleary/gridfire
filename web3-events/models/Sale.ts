import { Schema, Types, model } from "mongoose";

const { ObjectId } = Schema.Types;

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
  transaction: object;
  type: SaleType;
  user: Types.ObjectId;
  userAddress: string;
}

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
