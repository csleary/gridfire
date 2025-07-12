import Edition from "@gridfire/shared/models/Edition";
import { model, Schema } from "mongoose";

interface ITransfer {
  blockNumber: string;
  from: string;
  id: string;
  logIndex: string;
  operator: string;
  to: string;
  transactionHash: string;
  type: string;
  value: string;
}

const transferSchema = new Schema<ITransfer>(
  {
    blockNumber: { required: true, type: String },
    from: { required: true, type: String },
    id: { ref: Edition, required: true, type: String },
    logIndex: { required: true, type: String },
    operator: { required: true, type: String },
    to: { required: true, type: String },
    transactionHash: { required: true, type: String },
    type: { default: "single", enum: ["single", "batch"], type: String },
    value: { required: true, type: String }
  },
  { timestamps: true }
);

transferSchema.index({ from: 1 });
transferSchema.index({ to: 1 });

export type { ITransfer };
export default model<ITransfer>("Transfer", transferSchema, "transfers");
