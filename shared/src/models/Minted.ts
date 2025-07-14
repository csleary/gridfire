import { model, ObjectId, Schema } from "mongoose";

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
    amount: { required: true, type: String },
    artistAddress: { required: true, type: String },
    blockNumber: { required: true, type: String },
    editionId: { required: true, type: String },
    logIndex: { type: String },
    objectId: { ref: Edition, required: true, type: Schema.ObjectId },
    price: { required: true, type: String },
    releaseId: { ref: Release, required: true, type: Schema.ObjectId },
    transactionHash: { required: true, type: String }
  },
  { timestamps: true }
);

/* eslint-disable perfectionist/sort-objects*/
mintedSchema.index({ transactionHash: 1, logIndex: 1 }, { unique: true });
mintedSchema.index({ releaseId: 1 });
/* eslint-enable perfectionist/sort-objects*/

export default model<Minted>("Minted", mintedSchema, "minted");
