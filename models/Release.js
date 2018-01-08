const mongoose = require('mongoose');

const { Schema } = mongoose;

const releaseSchema = new Schema({
  _user: { type: Schema.Types.ObjectId, ref: 'User' },
  artistName: { type: String, trim: true },
  releaseTitle: { type: String, trim: true },
  artwork: String,
  releaseDate: Date,
  price: Number,
  recordLabel: { type: String, trim: true },
  catNumber: { type: String, trim: true },
  trackList: [
    {
      trackTitle: { type: String, trim: true },
      hasAudio: { type: Boolean, default: false }
    }
  ],
  dateCreated: Date,
  numSold: { type: Number, default: 0 },
  published: { type: Boolean, default: false }
});

mongoose.model('releases', releaseSchema);
