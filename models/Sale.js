const mongoose = require('mongoose');

const { Schema } = mongoose;

const saleSchema = new Schema({
  releaseId: { type: Schema.Types.ObjectId, ref: 'Release' },
  purchases: [
    {
      purchaseDate: Date,
      amountPaid: Number,
      buyer: { type: Schema.Types.ObjectId, ref: 'User' },
      buyerAddress: String
    }
  ]
});

mongoose.model('sales', saleSchema);
