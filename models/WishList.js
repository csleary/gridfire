import mongoose from "mongoose";

const { Schema } = mongoose;

const wishListSchema = new Schema({
  release: { type: Schema.Types.ObjectId, ref: "Release" },
  dateAdded: { type: Date },
  note: { type: String },
  user: { type: Schema.Types.ObjectId, ref: "User" }
});

wishListSchema.index({ user: 1, release: 1 }, { unique: true });
const WishList = mongoose.model("WishList", wishListSchema, "wish-lists");
export default WishList;
