const mongoose = require('mongoose');
const { Schema } = mongoose;

const CreditPayment = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  purchaseDate: Date,
  sku: String,
  paymentId: String,
  transactions: Array
});

CreditPayment.index({ user: 1 });
mongoose.model('credit-payments', CreditPayment);
