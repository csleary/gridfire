import { ObjectId, Schema, model } from "mongoose";

export interface IUser {
  _id: ObjectId;
  account: string;
  emailAddress: string;
  lastLogin: Date;
  paymentAddress: string;
  username: string;
}

const userSchema = new Schema<IUser>(
  {
    account: { type: String, trim: true, required: true },
    emailAddress: { type: String, trim: true, lowercase: true, default: "" },
    lastLogin: { type: Date },
    paymentAddress: { type: String, trim: true },
    username: { type: String, trim: true, lowercase: true, default: "" }
  },
  { timestamps: true }
);

userSchema.set("toJSON", { versionKey: false });

const User = model("User", userSchema, "users");

export default User;
