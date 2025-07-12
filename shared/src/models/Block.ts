import { model, Schema } from "mongoose";

interface IBlock {
  _id: string;
  lastQueuedBlock: number;
  lastQueuedBlockHex: string;
}

const blockSchema = new Schema<IBlock>(
  {
    _id: { default: "arbitrum_dispatcher", required: true, type: String },
    lastQueuedBlock: { required: true, type: Number },
    lastQueuedBlockHex: { required: true, type: String }
  },
  { timestamps: true }
);

blockSchema.index({ lastQueuedBlock: 1 }, { unique: true });
blockSchema.index({ lastQueuedBlockHex: 1 }, { unique: true });

export default model("Block", blockSchema, "blocks");
