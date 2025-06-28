import { ObjectId, Schema, model } from "mongoose";

interface IWishList {
  release: ObjectId;
  dateAdded: Date;
  note: string;
  user: ObjectId;
}

const { ObjectId } = Schema.Types;

const wishListSchema = new Schema<IWishList>({
  release: { type: ObjectId, ref: "Release" },
  dateAdded: { type: Date },
  note: { type: String },
  user: { type: ObjectId, ref: "User" }
});

wishListSchema.index({ user: 1, release: 1 }, { unique: true });

export { IWishList };
export default model<IWishList>("WishList", wishListSchema, "lists");
