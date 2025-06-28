import { ObjectId, Schema, model } from "mongoose";

interface IStream {
  date: Date;
  startTime: number;
  totalTimePlayed: number;
  trackId: ObjectId;
  user: ObjectId;
}

const { ObjectId } = Schema.Types;

const streamSchema = new Schema<IStream>({
  date: { type: Date, default: Date.now },
  startTime: { type: Number },
  totalTimePlayed: { type: Number, default: 0 },
  trackId: { type: ObjectId },
  user: { type: ObjectId, ref: "User" }
});

streamSchema.index({ user: 1, trackId: 1 }, { unique: true });
streamSchema.index({ date: 1 }, { expireAfterSeconds: 60 * 60 });

export default model<IStream>("Stream", streamSchema, "streams");
