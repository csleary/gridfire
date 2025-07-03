import Release from "@gridfire/shared/models/Release";
import User from "@gridfire/shared/models/User";
import { ObjectId, Schema, model } from "mongoose";

export enum SaleType {
  Single = "single",
  Album = "album",
  Edition = "edition"
}

export interface ISale {
  _id: ObjectId;
  artistAddress: string;
  blockNumber: string;
  fee: string;
  logIndex: string;
  netAmount: string;
  paid: string;
  purchaseDate: Date;
  release: ObjectId;
  transactionHash: string;
  type: SaleType;
  user: ObjectId;
  userAddress: string;
}

const { ObjectId } = Schema.Types;

const saleSchema = new Schema<ISale>(
  {
    artistAddress: { type: String },
    blockNumber: { type: String, required: true },
    fee: { type: String },
    logIndex: { type: String },
    netAmount: { type: String },
    paid: { type: String },
    purchaseDate: Date,
    release: { type: ObjectId, ref: Release },
    transactionHash: { type: String, required: true },
    type: { type: String, enum: SaleType, default: SaleType.Album },
    user: { type: ObjectId, ref: User },
    userAddress: { type: String }
  },
  { timestamps: true }
);

saleSchema.index({ transactionHash: 1, logIndex: 1 }, { unique: true });
saleSchema.index({ user: 1, release: 1 });
saleSchema.index({ artistAddress: 1 });

export default model("Sale", saleSchema, "sales");
