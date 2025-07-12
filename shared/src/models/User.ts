import { model, ObjectId, Schema } from "mongoose";

interface IUser {
  _id: ObjectId;
  account: string;
  emailAddress: string;
  lastLogin: Date;
  paymentAddress: string;
  username: string;
}

const userSchema = new Schema<IUser>(
  {
    account: { required: true, trim: true, type: String },
    emailAddress: { default: "", lowercase: true, trim: true, type: String },
    lastLogin: { type: Date },
    paymentAddress: { trim: true, type: String },
    username: { default: "", lowercase: true, trim: true, type: String }
  },
  { timestamps: true }
);

userSchema.set("toJSON", { versionKey: false });
userSchema.index({ account: 1 });

export { IUser };
export default model("User", userSchema, "users");
