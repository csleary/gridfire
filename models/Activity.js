import mongoose from "mongoose";

const { Schema } = mongoose;
const { ObjectId } = Schema.Types;

const activitySchema = new Schema(
  {
    user: { type: ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["follow", "purchase"], required: true },
    artist: { type: ObjectId, ref: "Artist" },
    album: { type: ObjectId, ref: "Album" },
    edition: { type: ObjectId, ref: "Edition" }
  },
  { timestamps: true }
);

activitySchema.index({ artist: 1, user: 1 });

const Activity = mongoose.model("Activity", activitySchema, "activities");

export default Activity;
