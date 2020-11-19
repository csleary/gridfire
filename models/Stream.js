const mongoose = require('mongoose');
const { Schema } = mongoose;

const streamSchema = new Schema({
  segmentsFetched: { type: Array },
  trackId: { type: Schema.Types.ObjectId },
  release: { type: Schema.Types.ObjectId, ref: 'Release' },
  user: { type: Schema.Types.ObjectId, ref: 'User' }
});

streamSchema.index({ user: 1, trackId: 1 }, { expireAfterSeconds: 60 * 5 });
mongoose.model('streams', streamSchema);
