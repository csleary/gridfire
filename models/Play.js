const mongoose = require('mongoose');
const { Schema } = mongoose;

const playSchema = new Schema({
  date: { type: Date },
  trackId: { type: Schema.Types.ObjectId },
  release: { type: Schema.Types.ObjectId, ref: 'Release' },
  user: { type: Schema.Types.ObjectId, ref: 'User' }
});

playSchema.index({ trackId: 1, date: -1, user: 1 });
mongoose.model('plays', playSchema);
