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

activitySchema.static("mint", function (artist, edition) {
  return this.findOneAndUpdate(
    { artist, edition },
    { $setOnInsert: { artist, edition, type: "mint" } },
    { upsert: true }
  ).exec();
});

activitySchema.static("sale", function ({ artist, editionId, release, sale, user }) {
  return this.findOneAndUpdate(
    { ...(editionId ? { editionId } : {}), artist, release, sale, user },
    { $setOnInsert: { ...(editionId ? { editionId } : {}), artist, release, type: "sale", sale, user } },
    { upsert: true }
  ).exec();
});

activitySchema.index({ artist: 1, user: 1 });

const Activity = mongoose.model("Activity", activitySchema, "activities");

export default Activity;
