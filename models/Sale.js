import mongoose from "mongoose";

const { Schema } = mongoose;
const { ObjectId } = Schema.Types;

const saleSchema = new Schema({
  purchaseDate: Date,
  release: { type: ObjectId, ref: "Release" },
  paid: { type: String },
  fee: { type: String },
  netAmount: { type: String },
  transaction: { type: Object },
  type: { type: String, enum: ["single", "album", "edition"], default: "album" },
  user: { type: ObjectId, ref: "User" },
  userAddress: { type: String }
});

saleSchema.index({ user: 1, release: 1 }, { unique: true });

const Sale = mongoose.model("Sale", saleSchema, "sales");

export default Sale;
