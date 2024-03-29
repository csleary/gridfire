import { Model, ObjectId, Schema, model } from "mongoose";

enum ActivityType {
  Favourite = "favourite",
  Follow = "follow",
  Mint = "mint",
  Publish = "publish",
  Sale = "sale"
}

interface IActivity {
  _id: ObjectId;
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

activitySchema.static(ActivityType.Mint, function (artist, editionId) {
  return this.findOneAndUpdate(
    { artist, editionId, type: ActivityType.Mint },
    { $setOnInsert: { artist, editionId, type: ActivityType.Mint } },
    { upsert: true }
  ).exec();
});

activitySchema.static(ActivityType.Sale, function ({ artist, editionId, release, sale, user }) {
  return this.findOneAndUpdate(
    { ...(editionId ? { editionId } : {}), artist, release, sale, type: ActivityType.Sale, user },
    { $setOnInsert: { ...(editionId ? { editionId } : {}), artist, release, type: ActivityType.Sale, sale, user } },
    { upsert: true }
  ).exec();
});

activitySchema.index({ artist: 1, user: 1 });

const Activity = model<IActivity, ActivityModel>("Activity", activitySchema, "activity");

export default Activity;
