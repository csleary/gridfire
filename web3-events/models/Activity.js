import mongoose from "mongoose";

const { Schema } = mongoose;
const { ObjectId } = Schema.Types;

const activitySchema = new Schema(
  {
    user: { type: ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["favourite", "follow", "mint", "publish", "sale"], required: true },
    artist: { type: ObjectId, ref: "Artist" },
    release: { type: ObjectId, ref: "Release" },
    edition: { type: ObjectId, ref: "Edition" }
  },
  { timestamps: true }
);

activitySchema.static("mint", function (artist, edition) {
  return this.findOneAndUpdate(
    { artist, edition },
    { $setOnInsert: { artist, edition, type: "mint" } },
    { upsert: true }
  ).exec();
});

activitySchema.static("sale", function (artist, release, edition, user) {
  return this.findOneAndUpdate(
    { ...(edition ? { edition } : {}), artist, release, user },
    { $setOnInsert: { ...(edition ? { edition } : {}), artist, release, type: "sale", user } },
    { upsert: true }
  ).exec();
});

activitySchema.index({ artist: 1, user: 1 });

const Activity = mongoose.model("Activity", activitySchema, "activities");

export default Activity;
