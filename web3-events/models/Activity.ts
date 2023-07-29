import { Model, ObjectId, Schema, model } from "mongoose";

enum ActivityType {
  Favourite = "favourite",
  Follow = "follow",
  Mint = "mint",
  Publish = "publish",
  Sale = "sale"
}

interface IActivity {
  artist: ObjectId;
  editionId: string;
  release: ObjectId;
  sale: ObjectId;
  type: ActivityType;
  user: ObjectId;
}

interface SaleParams {
  artist: string;
  editionId?: string;
  release: string;
  sale: string;
  user: string;
}

interface ActivityModel extends Model<IActivity> {
  mint(artist: string, editionId: string): void;
  sale(params: SaleParams): void;
}

const { ObjectId } = Schema.Types;

const activitySchema = new Schema<IActivity, ActivityModel>(
  {
    user: { type: ObjectId, ref: "User", required: true },
    type: { type: String, enum: ActivityType, required: true },
    artist: { type: ObjectId, ref: "Artist" },
    release: { type: ObjectId, ref: "Release" },
    editionId: { type: String },
    sale: { type: ObjectId, ref: "Sale" }
  },
  { timestamps: true }
);

activitySchema.static("mint", function (artist, editionId) {
  return this.findOneAndUpdate(
    { artist, editionId, type: "mint" },
    { $setOnInsert: { artist, editionId, type: "mint" } },
    { upsert: true }
  ).exec();
});

activitySchema.static("sale", function ({ artist, editionId, release, sale, user }) {
  return this.findOneAndUpdate(
    { ...(editionId ? { editionId } : {}), artist, release, sale, type: "sale", user },
    { $setOnInsert: { ...(editionId ? { editionId } : {}), artist, release, type: "sale", sale, user } },
    { upsert: true }
  ).exec();
});

activitySchema.index({ artist: 1, user: 1 });

const Activity = model<IActivity, ActivityModel>("Activity", activitySchema, "activity");

export default Activity;
