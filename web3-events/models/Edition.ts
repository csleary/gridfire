import mongoose from "mongoose";

const { Schema } = mongoose;

const editionSchema = new Schema(
  {
    release: { type: Schema.Types.ObjectId, ref: "Release", required: true },
    editionId: { type: String },
    amount: { type: String, required: true },
    price: { type: String, required: true },
    status: { type: String, enum: ["pending", "minted"], default: "pending" },
    metadata: { type: Object, required: true },
    cid: { type: String, required: true }
  },
  { timestamps: true }
);

editionSchema.index({ release: 1 });
const Edition = mongoose.model("Edition", editionSchema, "editions");
export default Edition;
