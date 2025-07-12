import { model, Schema } from "mongoose";

interface Claim {
  artist: string;
  blockNumber: string;
  logIndex: string;
  transactionHash: string;
  value: string;
}

const claimSchema = new Schema<Claim>(
  {
    artist: { required: true, type: String },
    blockNumber: { required: true, type: String },
    logIndex: { required: true, type: String },
    transactionHash: { required: true, type: String },
    value: { required: true, type: String }
  },
  { timestamps: true }
);

// eslint-disable-next-line perfectionist/sort-objects
claimSchema.index({ transactionHash: 1, logIndex: 1 }, { unique: true });
claimSchema.index({ artist: 1 });

export default model<Claim>("Claim", claimSchema, "claims");
