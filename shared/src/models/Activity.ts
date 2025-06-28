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
  favourite(artist: string, release: string, user: string): void;
  follow(artist: string, user: string): void;
  mint(artist: string, editionId: string): void;
  publish(artist: string, release: string): void;
  sale(params: SaleParams): void;
}

const { ObjectId } = Schema.Types;

const activitySchema = new Schema<IActivity, ActivityModel>(
  {
    artist: { type: ObjectId, ref: "Artist", required: true },
    editionId: { type: String },
    release: { type: ObjectId, ref: "Release" },
    sale: { type: ObjectId, ref: "Sale" },
    type: { type: String, enum: ActivityType, required: true },
    user: { type: ObjectId, ref: "User", required: true }
  },
  { timestamps: true }
);

activitySchema.static(ActivityType.Favourite, function (artist, release, user) {
  return this.findOneAndUpdate(
    { artist, release, type: ActivityType.Favourite, user },
    { $setOnInsert: { artist, release, type: ActivityType.Favourite, user } },
    { upsert: true }
  ).exec();
});

activitySchema.static(ActivityType.Follow, function (artist, user) {
  return this.findOneAndUpdate(
    { artist, type: ActivityType.Follow, user },
    { $setOnInsert: { artist, type: ActivityType.Follow, user } },
    { upsert: true }
  ).exec();
});

activitySchema.static(ActivityType.Mint, function (artist, editionId) {
  return this.findOneAndUpdate(
    { artist, editionId, type: ActivityType.Mint },
    { $setOnInsert: { artist, editionId, type: ActivityType.Mint } },
    { upsert: true }
  ).exec();
});

activitySchema.static(ActivityType.Publish, function (artist, release) {
  return this.findOneAndUpdate(
    { artist, release, type: ActivityType.Publish },
    { $setOnInsert: { artist, release, type: ActivityType.Publish } },
    { upsert: true }
  ).exec();
});

activitySchema.static(ActivityType.Sale, function ({ artist, editionId, release, sale, user }) {
  return this.findOneAndUpdate(
    { ...(editionId ? { editionId } : {}), artist, release, sale, user },
    { $setOnInsert: { ...(editionId ? { editionId } : {}), artist, release, sale, type: ActivityType.Sale, user } },
    { upsert: true }
  ).exec();
});

activitySchema.index({ artist: 1, user: 1 });
activitySchema.index({ createdAt: -1 });

export default model<IActivity, ActivityModel>("Activity", activitySchema, "activity");
