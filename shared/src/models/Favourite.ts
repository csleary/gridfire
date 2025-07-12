import { model, ObjectId, Schema } from "mongoose";

interface IFavourite {
  dateAdded: Date;
  release: ObjectId;
  trackId: ObjectId;
  user: ObjectId;
}

const { ObjectId } = Schema.Types;

const favouriteSchema = new Schema<IFavourite>({
  dateAdded: { required: true, type: Date },
  release: { ref: "Release", required: true, type: ObjectId },
  trackId: { required: false, type: ObjectId },
  user: { ref: "User", required: true, type: ObjectId }
});

// eslint-disable-next-line perfectionist/sort-objects
favouriteSchema.index({ user: 1, release: 1 }, { unique: true });

export { IFavourite };
export default model<IFavourite>("Favourite", favouriteSchema, "favourites");
