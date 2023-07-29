import { ObjectId, Schema, model } from "mongoose";

interface IFollower {
  follower: ObjectId;
  following: ObjectId;
}

const { ObjectId } = Schema.Types;

const followerSchema = new Schema<IFollower>(
  {
    follower: { type: ObjectId, ref: "User" },
    following: { type: ObjectId, ref: "Artist" }
  },
  { timestamps: true }
);

followerSchema.index({ follower: 1, following: 1 }, { unique: true });
followerSchema.index({ following: 1, follower: 1 }, { unique: true });

const Followers = model("Follower", followerSchema, "followers");

export default Followers;
