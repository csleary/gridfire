import { model, Schema } from "mongoose";

interface Approval {
  blockNumber: string;
  logIndex: string;
  owner: string;
  spender: string;
  transactionHash: string;
  value: string;
}

const approvalSchema = new Schema<Approval>(
  {
    blockNumber: { required: true, type: String },
    logIndex: { required: true, type: String },
    owner: { required: true, type: String },
    spender: { required: true, type: String },
    transactionHash: { required: true, type: String },
    value: { required: true, type: String }
  },
  { timestamps: true }
);

/* eslint-disable perfectionist/sort-objects*/
approvalSchema.index({ transactionHash: 1, logIndex: 1, createdAt: -1 }, { unique: true });
approvalSchema.index({ owner: 1, createdAt: -1 });
/* eslint-enable perfectionist/sort-objects*/

export default model<Approval>("Approval", approvalSchema, "approvals");
