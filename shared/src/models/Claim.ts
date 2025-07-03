import { Schema, model } from "mongoose";

interface Claim {
  artist: string;
  blockNumber: string;
  logIndex: string;
  transactionHash: string;
  value: string;
}

const claimSchema = new Schema<Claim>(
  {
    artist: { type: String, required: true },
    blockNumber: { type: String, required: true },
    logIndex: { type: String, required: true },
    transactionHash: { type: String, required: true },
    value: { type: String, required: true }
  },
  { timestamps: true }
);

claimSchema.index({ transactionHash: 1, logIndex: 1 }, { unique: true });
claimSchema.index({ artist: 1 });

export default model<Claim>("Claim", claimSchema, "claims");
