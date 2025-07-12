import { model, ObjectId, Schema } from "mongoose";

interface IFollower {
  follower: ObjectId;
  following: ObjectId;
}

const { ObjectId } = Schema.Types;

const followerSchema = new Schema<IFollower>(
  {
    follower: { ref: "User", type: ObjectId },
    following: { ref: "Artist", type: ObjectId }
  },
  { timestamps: true }
);

followerSchema.index({ follower: 1, following: 1 }, { unique: true });
// eslint-disable-next-line perfectionist/sort-objects
followerSchema.index({ following: 1, follower: 1 }, { unique: true });

export default model<IFollower>("Follower", followerSchema, "followers");
