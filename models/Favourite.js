import mongoose from "mongoose";

const { Schema } = mongoose;

const favouriteSchema = new Schema({
  release: { type: Schema.Types.ObjectId, ref: "Release" },
  dateAdded: { type: Date },
  user: { type: Schema.Types.ObjectId, ref: "User" }
});

favouriteSchema.index({ user: 1, release: 1 }, { unique: true });
mongoose.model("favourites", favouriteSchema);

const Favourite = mongoose.model("Favourite", favouriteSchema, "favourites");
export default Favourite;
