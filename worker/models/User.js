import mongoose from "mongoose";

const { Schema } = mongoose;

const userSchema = new Schema(
  {
    account: { type: String, trim: true },
    email: { type: String, trim: true },
    key: { type: String, select: false },
    lastLogin: { type: Date },
    paymentAddress: { type: String, trim: true }
  },
  { timestamps: true, toJSON: { versionKey: false } }
);

const User = mongoose.model("User", userSchema, "users");
export default User;
