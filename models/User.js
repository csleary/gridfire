const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSchema = new Schema(
  {
    auth: {
      email: { type: String, trim: true },
      oauthService: String,
      oauthId: String,
      isLocal: Boolean,
      password: String,
      idHash: String,
      resetToken: String,
      resetExpire: Date,
      dateCreated: Date,
      lastLogin: Date
    },
    nemAddress: { type: String, default: '' },
    nemAddressChallenge: String,
    nemAddressVerified: { type: Boolean, default: false },
    credits: { type: Number, default: 0 }
  },
  { toJSON: { versionKey: false } }
);

userSchema.pre('save', async function (next) {
  try {
    if (!this.isModified('auth.password')) return next();

    if (this.auth.password) {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(this.auth.password, salt);
      this.auth.password = hash;
    }

    return next();
  } catch (err) {
    return next(err);
  }
});

userSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.auth.password);
};

mongoose.model('users', userSchema);
