import { Schema, model } from "mongoose";

interface Approval {
  blockNumber: string;
  owner: string;
  spender: string;
  value: string;
  logIndex: string;
  transactionHash: string;
}

const approvalSchema = new Schema<Approval>(
  {
    blockNumber: { type: String, required: true },
    owner: { type: String, required: true },
    spender: { type: String, required: true },
    value: { type: String, required: true },
    logIndex: { type: String, required: true },
    transactionHash: { type: String, required: true }
  },
  { timestamps: true }
);

approvalSchema.index({ transactionHash: 1, logIndex: 1, createdAt: -1 }, { unique: true });
approvalSchema.index({ owner: 1, createdAt: -1 });

export default model<Approval>("Approval", approvalSchema, "approvals");
