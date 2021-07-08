import mongoose from 'mongoose';
const { Schema } = mongoose;

const wishSchema = new Schema({
  release: { type: Schema.Types.ObjectId, ref: 'Release' },
  dateAdded: { type: Date },
  user: { type: Schema.Types.ObjectId, ref: 'User' }
});

wishSchema.index({ user: 1, release: 1 }, { unique: true });
const Wish = mongoose.model('Wish', wishSchema, 'wishlist');
export default Wish;
