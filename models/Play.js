const mongoose = require('mongoose');

const { Schema } = mongoose;

const playSchema = new Schema({
  trackId: { type: Schema.Types.ObjectId },
  playCount: { type: Number },
  release: { type: Schema.Types.ObjectId, ref: 'Release' },
  users: [{ type: Schema.Types.ObjectId, ref: 'User' }]
});

mongoose.model('plays', playSchema);
