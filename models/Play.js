const mongoose = require('mongoose');
const { Schema } = mongoose;

const playSchema = new Schema({
  date: { type: Date },
  trackId: { type: Schema.Types.ObjectId },
  release: { type: Schema.Types.ObjectId, ref: 'Release' },
  user: { type: Schema.Types.ObjectId, ref: 'User' }
});

playSchema.index({ user: 1, date: 1, trackId: 1 });
mongoose.model('plays', playSchema);
