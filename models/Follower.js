import mongoose from "mongoose";

const { Schema } = mongoose;
const { ObjectId } = Schema.Types;

const followerSchema = new Schema(
  {
    follower: { type: ObjectId, ref: "User" },
    following: { type: ObjectId, ref: "Artist" }
  },
  { timestamps: true }
);

followerSchema.index({ follower: 1, following: 1 }, { unique: true });

const Followers = mongoose.model("Follower", followerSchema, "followers");

export default Followers;
