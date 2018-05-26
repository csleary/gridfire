const mongoose = require('mongoose');

const { Schema } = mongoose;

const saleSchema = new Schema({
  releaseId: String,
  purchases: [
    {
      _id: false,
      date: String,
      numSold: { type: Number, default: 0 }
    }
  ]
});

mongoose.model('sales', saleSchema);
