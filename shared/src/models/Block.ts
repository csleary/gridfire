import { Schema, model } from "mongoose";

interface IBlock {
  _id: string;
  lastQueuedBlock: number;
  lastQueuedBlockHex: string;
}

const blockSchema = new Schema<IBlock>(
  {
    _id: { type: String, required: true, default: "arbitrum_dispatcher" },
    lastQueuedBlock: { type: Number, required: true },
    lastQueuedBlockHex: { type: String, required: true }
  },
  { timestamps: true }
);

blockSchema.index({ lastQueuedBlock: 1 }, { unique: true });
blockSchema.index({ lastQueuedBlockHex: 1 }, { unique: true });

export default model("Block", blockSchema, "blocks");
