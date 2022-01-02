import mongoose from 'mongoose';
const { Schema } = mongoose;

const saleSchema = new Schema({
  purchaseDate: Date,
  release: { type: Schema.Types.ObjectId, ref: 'Release' },
  paid: Number,
  transaction: { type: Object },
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  userAddress: String
});

saleSchema.index({ user: 1, release: 1 }, { unique: true });
const Sale = mongoose.model('Sale', saleSchema, 'sales');
export default Sale;
