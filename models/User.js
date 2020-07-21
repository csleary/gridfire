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
    credits: { type: Number, default: 0 },
    purchases: [
      {
        releaseId: { type: Schema.Types.ObjectId, ref: 'Release' },
        purchaseDate: Date,
        purchaseRef: { type: Schema.Types.ObjectId, ref: 'Sale.purchase', unique: true },
        transactions: Array
      }
    ],
    favourites: [
      {
        releaseId: { type: Schema.Types.ObjectId, ref: 'Release', unique: true },
        dateAdded: { type: Date }
      }
    ],
    wishList: [
      {
        releaseId: { type: Schema.Types.ObjectId, ref: 'Release', unique: true },
        dateAdded: { type: Date }
      }
    ],
    artists: [{ type: Schema.Types.ObjectId, ref: 'Artist', unique: true }]
  },
  {
    usePushEach: true
  }
);

UserSchema.pre('save', async function (next) {
  try {
    if (!this.isModified('auth.password')) return next();
    if (!this.auth.password && this.auth.googleId) return next();
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(this.auth.password, salt);
    this.auth.password = hash;
    return next();
  } catch (err) {
    return next(err);
  }
});

UserSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.auth.password);
};

mongoose.model('users', UserSchema);
