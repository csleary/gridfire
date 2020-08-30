const mongoose = require('mongoose');

const { Schema } = mongoose;

const paymentSchema = new Schema({
  dateCreated: Date,
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  sku: String,
  priceRawXem: Number,
  paymentId: String,
  nonce: String
});

paymentSchema.index({ dateCreated: 1 }, { expireAfterSeconds: 60 * 15 });
mongoose.model('payments', paymentSchema);
