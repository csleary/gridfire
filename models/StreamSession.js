const mongoose = require('mongoose');
const Play = mongoose.model('plays');
const { Schema } = mongoose;

const streamSessionSchema = new Schema({
  date: { type: Date, default: Date.now() },
  segmentsFetched: { type: Number, default: 0 },
  segmentsTotal: { type: Number },
  trackId: { type: Schema.Types.ObjectId },
  release: { type: Schema.Types.ObjectId, ref: 'Release' },
  user: { type: Schema.Types.ObjectId, ref: 'User' }
});

streamSessionSchema.post('findOneAndUpdate', async function (stream) {
  if (!stream) return;
  const { _id: streamId, segmentsFetched, segmentsTotal, trackId, release, user } = stream;

  if (segmentsFetched === 2) {
    await Play.create({ date: Date.now(), trackId, release, user });
  }

  if (segmentsFetched === segmentsTotal) {
    this.model.findByIdAndDelete(streamId).exec();
  }
});

streamSessionSchema.index({ user: 1, trackId: 1 }, { unique: true });
streamSessionSchema.index({ date: 1 }, { expireAfterSeconds: 60 * 5 });
mongoose.model('stream-sessions', streamSessionSchema);
