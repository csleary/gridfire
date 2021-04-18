const mongoose = require('mongoose');
const { Schema } = mongoose;

const saleSchema = new Schema({
  purchaseDate: Date,
  release: { type: Schema.Types.ObjectId, ref: 'Release' },
  amountPaid: Number,
  transactions: { type: Array },
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  userAddress: String
});

saleSchema.index({ user: 1, release: 1 });
const Sale = mongoose.model('Sale', saleSchema, 'sales');
module.exports = Sale;
