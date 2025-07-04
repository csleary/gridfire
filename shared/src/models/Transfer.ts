import Edition from "@gridfire/shared/models/Edition";
import { Schema, model } from "mongoose";

interface ITransfer {
  blockNumber: string;
  logIndex: string;
  transactionHash: string;
  operator: string;
  from: string;
  to: string;
  id: string;
  value: string;
  type: string;
}

const transferSchema = new Schema<ITransfer>(
  {
    blockNumber: { type: String, required: true },
    logIndex: { type: String, required: true },
    transactionHash: { type: String, required: true },
    operator: { type: String, required: true },
    from: { type: String, required: true },
    to: { type: String, required: true },
    id: { type: String, required: true, ref: Edition },
    value: { type: String, required: true },
    type: { type: String, enum: ["single", "batch"], default: "single" }
  },
  { timestamps: true }
);

transferSchema.index({ from: 1 });
transferSchema.index({ to: 1 });

export type { ITransfer };
export default model<ITransfer>("Transfer", transferSchema, "transfers");
