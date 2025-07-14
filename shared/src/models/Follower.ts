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

/* eslint-disable perfectionist/sort-objects*/
followerSchema.index({ follower: 1, following: 1 }, { unique: true });
followerSchema.index({ following: 1, follower: 1 }, { unique: true });
/* eslint-enable perfectionist/sort-objects*/

export default model<IFollower>("Follower", followerSchema, "followers");
