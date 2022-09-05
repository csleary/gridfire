import mongoose from "mongoose";
const { Schema } = mongoose;

const saleSchema = new Schema({
  purchaseDate: Date,
  release: { type: Schema.Types.ObjectId, ref: "Release" },
  paid: { type: Object },
  fee: { type: Object },
  netAmount: { type: Object },
  transaction: { type: Object },
  type: { type: String, enum: ["single", "album"], default: "album" },
  user: { type: Schema.Types.ObjectId, ref: "User" },
  userAddress: String
});

saleSchema.index({ user: 1, release: 1 }, { unique: true });
const Sale = mongoose.model("Sale", saleSchema, "sales");
export default Sale;
