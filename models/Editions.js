import mongoose from "mongoose";

const { Schema } = mongoose;

const editionSchema = new Schema(
  {
    release: { type: Schema.Types.ObjectId, ref: "Release", required: true },
    artist: { type: Schema.Types.ObjectId, ref: "Artist", required: true },
    artwork: { type: String, required: true },
    price: { type: Number, required: true },
    runOf: { type: Number, required: true },
    metadata: { type: Object, required: true },
    metadataCid: { type: String, required: true }
  },
  { timestamps: true }
);

editionSchema.index({ artist: 1, release: 1 }, { unique: true });
const Edition = mongoose.model("Edition", editionSchema, "editions");
export default Edition;
