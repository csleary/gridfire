import { ObjectId, Schema, model } from "mongoose";

interface IFavourite {
  release: ObjectId;
  dateAdded: Date;
  trackId: ObjectId;
  user: ObjectId;
}

const { ObjectId } = Schema.Types;

const favouriteSchema = new Schema<IFavourite>({
  release: { type: ObjectId, ref: "Release", required: true },
  dateAdded: { type: Date, required: true },
  trackId: { type: ObjectId, required: false },
  user: { type: ObjectId, ref: "User", required: true }
});

favouriteSchema.index({ user: 1, release: 1 }, { unique: true });

export { IFavourite };
export default model<IFavourite>("Favourite", favouriteSchema, "favourites");
