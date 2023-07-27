import mongoose from "mongoose";

const { Schema } = mongoose;

const favouriteSchema = new Schema({
  release: { type: Schema.Types.ObjectId, ref: "Release", required: true },
  dateAdded: { type: Date, required: true },
  trackId: { type: Schema.Types.ObjectId, required: false },
  user: { type: Schema.Types.ObjectId, ref: "User", required: true }
});

favouriteSchema.index({ user: 1, release: 1 }, { unique: true });

const Favourite = mongoose.model("Favourite", favouriteSchema, "favourites");

export default Favourite;
