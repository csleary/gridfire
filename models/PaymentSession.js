import mongoose from 'mongoose';
const { Schema } = mongoose;

const paymentSessionSchema = new Schema({
  dateCreated: Date,
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  sku: String,
  priceRawXem: Number,
  paymentId: String,
  nonce: String
});

paymentSessionSchema.index({ dateCreated: 1 }, { expireAfterSeconds: 60 * 15 });
const PaymentSession = mongoose.model('PaymentSession', paymentSessionSchema, 'payment-sessions');
export default PaymentSession;
