import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
const { Schema } = mongoose;

const userSchema = new Schema(
  {
    auth: {
      account: { type: String, trim: true },
      idHash: String,
      lastLogin: Date
    },
    email: { type: String, trim: true },
    paymentAddress: { type: String, trim: true }
  },
  { timestamps: true, toJSON: { versionKey: false, virtuals: true } }
);

const User = mongoose.model('User', userSchema, 'users');
export default User;
