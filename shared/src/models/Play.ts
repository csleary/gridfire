import { ObjectId, Schema, model } from "mongoose";

interface IPlay {
  date: Date;
  trackId: ObjectId;
  release: ObjectId;
  user: ObjectId;
}

const { ObjectId } = Schema.Types;

const playSchema = new Schema<IPlay>({
  date: { type: Date },
  trackId: { type: ObjectId },
  release: { type: ObjectId, ref: "Release" },
  user: { type: ObjectId, ref: "User" }
});

playSchema.index({ release: 1, trackId: 1, date: -1, user: 1 });

export default model<IPlay>("Play", playSchema, "plays");
