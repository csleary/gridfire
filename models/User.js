const bcrypt = require('bcrypt');
const mongoose = require('mongoose');

const { Schema } = mongoose;

const UserSchema = new Schema({
  auth: {
    email: { type: String, trim: true },
    googleId: String,
    idHash: String,
    name: String,
    password: String
  },
  nemAddress: String,
  purchases: [
    {
      purchaseDate: Date,
      id: String
    }
  ]
});

UserSchema.pre('save', async function(next) {
  try {
    const user = this;
    if (!user.isModified('auth.password')) return next();
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(user.auth.password, salt);
    user.auth.password = hash;
    return next();
  } catch (err) {
    return next(err);
  }
});

UserSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    const isMatch = await bcrypt.compare(candidatePassword, this.auth.password);
    return isMatch;
  } catch (err) {
    return err;
  }
};

mongoose.model('users', UserSchema);
