import mongoose from 'mongoose';
const { Schema } = mongoose;

const wishlistSchema = new Schema({
  release: { type: Schema.Types.ObjectId, ref: 'Release' },
  dateAdded: { type: Date },
  user: { type: Schema.Types.ObjectId, ref: 'User' }
});

wishlistSchema.index({ user: 1, release: 1 }, { unique: true });
const Wishlist = mongoose.model('Wishlist', wishlistSchema, 'wishlists');
export default Wishlist;
