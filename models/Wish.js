const mongoose = require('mongoose');
const { Schema } = mongoose;

const wishSchema = new Schema({
  release: { type: Schema.Types.ObjectId, ref: 'Release' },
  dateAdded: { type: Date },
  user: { type: Schema.Types.ObjectId, ref: 'User' }
});

wishSchema.index({ user: 1, release: 1 }, { unique: true });
mongoose.model('wishlist', wishSchema);
