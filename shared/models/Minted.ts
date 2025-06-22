import { ObjectId, Schema, model } from "mongoose";
import Release from "./Release.js";
import Edition from "./Edition.js";

interface Minted {
  transactionHash: string;
  blockNumber: string;
  releaseId: ObjectId;
  artistAddress: string;
  objectId: ObjectId;
  editionId: bigint;
  amount: bigint;
  price: bigint;
}

const MintedSchema = new Schema<Minted>(
  {
    transactionHash: { type: String, required: true },
    blockNumber: { type: String, required: true },
    releaseId: { type: Schema.ObjectId, ref: Release, required: true },
    artistAddress: { type: String, required: true },
    objectId: { type: Schema.ObjectId, ref: Edition, required: true },
    editionId: { type: String, required: true },
    amount: { type: String, required: true },
    price: { type: String, required: true }
  },
  {
    timestamps: true
  }
);

MintedSchema.index({ transactionHash: 1 }, { unique: true });
MintedSchema.index({ releaseId: 1 });

const Minted = model<Minted>("Minted", MintedSchema, "minted");

export default Minted;
