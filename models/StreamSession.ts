import { ObjectId, Schema, model } from "mongoose";

interface IStreamSession {
  date: Date;
  startTime: number;
  totalTimePlayed: number;
  trackId: ObjectId;
  user: ObjectId;
}

const { ObjectId } = Schema.Types;

const streamSessionSchema = new Schema<IStreamSession>({
  date: { type: Date, default: Date.now },
  startTime: { type: Number },
  totalTimePlayed: { type: Number, default: 0 },
  trackId: { type: ObjectId },
  user: { type: ObjectId, ref: "User" }
});

streamSessionSchema.index({ user: 1, trackId: 1 }, { unique: true });
streamSessionSchema.index({ date: 1 }, { expireAfterSeconds: 60 * 60 });

const StreamSession = model("StreamSession", streamSessionSchema, "stream-sessions");

export default StreamSession;
