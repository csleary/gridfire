import { ObjectId, Schema, model } from "mongoose";
import Edition from "./Edition.js";
import Release from "./Release.js";

interface Minted {
  amount: bigint;
  artistAddress: string;
  blockNumber: string;
  editionId: bigint;
  logIndex: string;
  objectId: ObjectId;
  price: bigint;
  releaseId: ObjectId;
  transactionHash: string;
}

const mintedSchema = new Schema<Minted>(
  {
    amount: { type: String, required: true },
    artistAddress: { type: String, required: true },
    blockNumber: { type: String, required: true },
    editionId: { type: String, required: true },
    logIndex: { type: String },
    objectId: { type: Schema.ObjectId, ref: Edition, required: true },
    price: { type: String, required: true },
    releaseId: { type: Schema.ObjectId, ref: Release, required: true },
    transactionHash: { type: String, required: true }
  },
  { timestamps: true }
);

mintedSchema.index({ transactionHash: 1, logIndex: 1 }, { unique: true });
mintedSchema.index({ releaseId: 1 });

export default model<Minted>("Minted", mintedSchema, "minted");
