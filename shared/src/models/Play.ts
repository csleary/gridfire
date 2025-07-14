import { model, ObjectId, Schema } from "mongoose";

interface IPlay {
  date: Date;
  release: ObjectId;
  trackId: ObjectId;
  user: ObjectId;
}

const { ObjectId } = Schema.Types;

const playSchema = new Schema<IPlay>({
  date: { type: Date },
  release: { ref: "Release", type: ObjectId },
  trackId: { type: ObjectId },
  user: { ref: "User", type: ObjectId }
});

/* eslint-disable perfectionist/sort-objects*/
playSchema.index({ release: 1, trackId: 1, date: -1, user: 1 });
/* eslint-enable perfectionist/sort-objects*/

export default model<IPlay>("Play", playSchema, "plays");
