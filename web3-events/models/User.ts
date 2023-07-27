import { Schema, model } from "mongoose";

interface IUser {
  account: string;
  email: string;
  lastLogin: Date;
  paymentAddress: string;
  username: string;
}

const userSchema = new Schema<IUser>(
  {
    account: { type: String, trim: true },
    email: { type: String, trim: true },
    lastLogin: { type: Date },
    paymentAddress: { type: String, trim: true },
    username: { type: String, trim: true }
  },
  { timestamps: true }
);

const User = model("User", userSchema, "users");

export default User;
