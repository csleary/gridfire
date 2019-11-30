const bcrypt = require('bcrypt');
const mongoose = require('mongoose');

const { Schema } = mongoose;

const UserSchema = new Schema(
  {
    auth: {
      email: { type: String, trim: true },
      googleId: String,
      idHash: String,
      isLocal: Boolean,
      password: String,
      resetToken: String,
      resetExpire: Date,
      lastLogin: Date
    },
    nemAddress: String,
    nemAddressVerified: { type: Boolean, default: false },
    credit: { type: Number, default: 0 },
    purchases: [
      {
        releaseId: { type: Schema.Types.ObjectId, ref: 'Release' },
        purchaseDate: Date,
        purchaseRef: { type: Schema.Types.ObjectId, ref: 'Sale.purchase' }
      }
    ],
    artists: [{ type: Schema.Types.ObjectId, ref: 'Artist' }]
  },
  {
    usePushEach: true
  }
);

UserSchema.pre('save', async function(next) {
  try {
    const user = this;

    if (!user.isModified('auth.password')) {
      return next();
    }

    if (!user.auth.password && user.auth.googleId) {
      return next();
    }

    const salt = await bcrypt.genSalt(10);

    const hash = await bcrypt.hash(user.auth.password, salt);

    user.auth.password = hash;
    return next();
  } catch (err) {
    return next(err);
  }
});

UserSchema.methods.comparePassword = async function(candidatePassword) {
  const isMatched = await bcrypt.compare(candidatePassword, this.auth.password);
  return isMatched;
};

mongoose.model('users', UserSchema);
