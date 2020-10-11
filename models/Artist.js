const mongoose = require('mongoose');
const { Schema } = mongoose;

const linkSchema = new Schema({
  title: { type: String, trim: true },
  uri: { type: String, trim: true }
});

const artistSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  name: { type: String, trim: true },
  biography: { type: String, trim: true },
  links: [linkSchema],
  releases: [{ type: Schema.Types.ObjectId, ref: 'Release' }]
});

artistSchema.set('toJSON', { versionKey: false });
mongoose.model('artists', artistSchema);
