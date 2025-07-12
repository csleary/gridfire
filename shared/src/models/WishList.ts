import { model, ObjectId, Schema } from "mongoose";

interface IWishList {
  dateAdded: Date;
  note: string;
  release: ObjectId;
  user: ObjectId;
}

const { ObjectId } = Schema.Types;

const wishListSchema = new Schema<IWishList>({
  dateAdded: { type: Date },
  note: { type: String },
  release: { ref: "Release", type: ObjectId },
  user: { ref: "User", type: ObjectId }
});

// eslint-disable-next-line perfectionist/sort-objects
wishListSchema.index({ user: 1, release: 1 }, { unique: true });

export { IWishList };
export default model<IWishList>("WishList", wishListSchema, "lists");
