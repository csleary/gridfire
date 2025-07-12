import Release from "@gridfire/shared/models/Release";
import User from "@gridfire/shared/models/User";
import { model, ObjectId, Schema } from "mongoose";

export enum SaleType {
  Album = "album",
  Edition = "edition",
  Single = "single"
}

export interface ISale {
  _id: ObjectId;
  artistAddress: string;
  blockNumber: string;
  editionId: null | string;
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
    blockNumber: { required: true, type: String },
    editionId: { default: null, type: String },
    fee: { type: String },
    logIndex: { type: String },
    netAmount: { type: String },
    paid: { type: String },
    purchaseDate: Date,
    release: { ref: Release, type: ObjectId },
    transactionHash: { required: true, type: String },
    type: { default: SaleType.Album, enum: SaleType, type: String },
    user: { ref: User, type: ObjectId },
    userAddress: { type: String }
  },
  { timestamps: true }
);

// eslint-disable-next-line perfectionist/sort-objects
saleSchema.index({ transactionHash: 1, logIndex: 1 }, { unique: true });
// eslint-disable-next-line perfectionist/sort-objects
saleSchema.index({ user: 1, release: 1 });
saleSchema.index({ artistAddress: 1 });

export default model("Sale", saleSchema, "sales");
