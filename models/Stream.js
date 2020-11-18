const mongoose = require('mongoose');

const { Schema } = mongoose;

const streamSchema = new Schema({
  segmentsFetched: { type: Array },
  release: { type: Schema.Types.ObjectId, ref: 'Release' },
  trackId: { type: Schema.Types.ObjectId },
  user: { type: Schema.Types.ObjectId, ref: 'User' }
});

streamSchema.index({ dateCreated: 1 }, { expireAfterSeconds: 60 * 10 });
mongoose.model('streams', streamSchema);
