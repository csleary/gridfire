import { model, ObjectId, Schema } from "mongoose";

interface IStream {
  date: Date;
  startTime: number;
  totalTimePlayed: number;
  trackId: ObjectId;
  user: ObjectId;
}

const { ObjectId } = Schema.Types;

const streamSchema = new Schema<IStream>({
  date: { default: Date.now, type: Date },
  startTime: { type: Number },
  totalTimePlayed: { default: 0, type: Number },
  trackId: { type: ObjectId },
  user: { ref: "User", type: ObjectId }
});

/* eslint-disable perfectionist/sort-objects*/
streamSchema.index({ user: 1, trackId: 1 }, { unique: true });
streamSchema.index({ date: 1 }, { expireAfterSeconds: 60 * 60 });
/* eslint-enable perfectionist/sort-objects*/

export default model<IStream>("Stream", streamSchema, "streams");
