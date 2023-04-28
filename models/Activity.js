import mongoose from "mongoose";

const { Schema } = mongoose;
const { ObjectId } = Schema.Types;

const activitySchema = new Schema(
  {
    user: { type: ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["favourite", "follow", "mint", "publish", "sale"], required: true },
    artist: { type: ObjectId, ref: "Artist" },
    release: { type: ObjectId, ref: "Release" },
    editionId: { type: String },
    sale: { type: ObjectId, ref: "Sale" }
  },
  { timestamps: true }
);

activitySchema.static("favourite", function (artist, release, user) {
  return this.findOneAndUpdate(
    { artist, release, user },
    { $setOnInsert: { artist, release, type: "favourite", user } },
    { upsert: true }
  ).exec();
});

activitySchema.static("follow", function (artist, user) {
  return this.findOneAndUpdate(
    { artist, user },
    { $setOnInsert: { artist, type: "follow", user } },
    { upsert: true }
  ).exec();
});

activitySchema.static("publish", function (artist, release) {
  return this.findOneAndUpdate(
    { artist, release },
    { $setOnInsert: { artist, release, type: "publish" } },
    { upsert: true }
  ).exec();
});

activitySchema.index({ artist: 1, user: 1 });
activitySchema.index({ createdAt: -1 });

const Activity = mongoose.model("Activity", activitySchema, "activities");

export default Activity;
