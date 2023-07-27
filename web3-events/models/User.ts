import mongoose from "mongoose";

const { Schema } = mongoose;

const userSchema = new Schema(
  {
    account: { type: String, trim: true },
    emailAddress: { type: String, trim: true },
    lastLogin: { type: Date },
    paymentAddress: { type: String, trim: true },
    username: { type: String, trim: true }
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema, "users");

export default User;
