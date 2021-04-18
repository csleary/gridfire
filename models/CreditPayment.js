const mongoose = require('mongoose');
const { Schema } = mongoose;

const creditPaymentSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  purchaseDate: Date,
  sku: String,
  paymentId: String,
  transactions: Array
});

creditPaymentSchema.index({ user: 1 });
const CreditPayment = mongoose.model('CreditPayment', creditPaymentSchema, 'credit-payments');
module.exports = CreditPayment;
