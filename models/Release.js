const mongoose = require('mongoose');

const { Schema } = mongoose;

const releaseSchema = new Schema({
  _user: { type: Schema.Types.ObjectId, ref: 'User' },
  artistName: { type: String, trim: true },
  artwork: String,
  catNumber: { type: String, trim: true },
  dateCreated: Date,
  price: Number,
  published: { type: Boolean, default: false },
  recordLabel: { type: String, trim: true },
  releaseDate: Date,
  releaseTitle: { type: String, trim: true },
  trackList: [
    {
      trackTitle: { type: String, trim: true },
      hasAudio: { type: Boolean, default: false }
    }
  ]
});

mongoose.model('releases', releaseSchema);
