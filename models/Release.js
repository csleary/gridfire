const mongoose = require('mongoose');

const { Schema } = mongoose;

const releaseSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    artist: { type: Schema.Types.ObjectId, ref: 'Artist' },
    artistName: { type: String, trim: true },
    releaseTitle: { type: String, trim: true },
    artwork: String,
    releaseDate: Date,
    price: Number,
    recordLabel: { type: String, trim: true },
    catNumber: { type: String, trim: true },
    credits: { type: String, trim: true },
    info: { type: String, trim: true },
    cLine: {
      year: Number,
      owner: { type: String, trim: true }
    },
    pLine: {
      year: Number,
      owner: { type: String, trim: true }
    },
    trackList: [
      {
        trackTitle: { type: String, trim: true },
        hasAudio: { type: Boolean, default: false }
      }
    ],
    dateCreated: Date,
    published: { type: Boolean, default: false }
  },
  {
    usePushEach: true
  }
);

mongoose.model('releases', releaseSchema);
