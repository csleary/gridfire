const mongoose = require('mongoose');
const { Schema } = mongoose;

const linkSchema = new Schema({
  title: { type: String, trim: true, default: '' },
  uri: { type: String, trim: true, default: '' }
});

const artistSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  name: { type: String, trim: true },
  slug: { type: String, trim: true },
  biography: { type: String, trim: true },
  links: [linkSchema],
  dateCreated: { type: Date },
  dateUpdated: { type: Date }
});

artistSchema.index(
  { slug: 1 },
  {
    unique: true,
    partialFilterExpression: {
      slug: { $exists: true, $type: 'string' }
    },
    collation: {
      locale: 'en',
      strength: 2
    }
  }
);

artistSchema.post('save', release => {
  release.updateOne({ dateUpdated: Date.now() }).exec();
});

artistSchema.set('toJSON', { versionKey: false });
const Artist = mongoose.model('Artist', artistSchema, 'artists');
module.exports = Artist;
