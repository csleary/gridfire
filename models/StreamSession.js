import mongoose from "mongoose";
const { Schema } = mongoose;

const streamSessionSchema = new Schema({
  date: { type: Date, default: Date.now },
  totalTimePlayed: { type: Number, default: 0 },
  startTime: { type: Number },
  trackId: { type: Schema.Types.ObjectId },
  user: { type: Schema.Types.ObjectId, ref: "User" }
});

streamSessionSchema.index({ user: 1, trackId: 1 }, { unique: true });
streamSessionSchema.index({ date: 1 }, { expireAfterSeconds: 60 * 60 });

const StreamSession = mongoose.model("StreamSession", streamSessionSchema, "stream-sessions");
export default StreamSession;
