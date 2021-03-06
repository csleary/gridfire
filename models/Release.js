const mongoose = require('mongoose');
const { Schema } = mongoose;

const releaseSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    artist: { type: Schema.Types.ObjectId, ref: 'Artist' },
    artistName: { type: String, trim: true },
    releaseTitle: { type: String, trim: true },
    artwork: {
      dateCreated: { type: Date },
      dateUpdated: { type: Date },
      status: { type: String, default: 'pending' }
    },
    releaseDate: { type: Date },
    price: { type: Number },
    recordLabel: { type: String, trim: true },
    catNumber: { type: String, trim: true },
    credits: { type: String, trim: true },
    info: { type: String, trim: true },
    pubYear: { type: String, trim: true },
    pubName: { type: String, trim: true },
    recYear: { type: String, trim: true },
    recName: { type: String, trim: true },
    trackList: [
      {
        trackTitle: { type: String, trim: true },
        status: { type: String, default: 'pending' },
        duration: { type: Number, trim: true },
        dateCreated: { type: Date },
        dateUpdated: { type: Date },
        mpd: { type: Buffer },
        segmentDuration: { type: Number },
        segmentTimescale: { type: Number },
        segmentList: { type: Array },
        initRange: { type: String }
      }
    ],
    tags: [String],
    dateCreated: { type: Date },
    dateUpdated: { type: Date },
    published: { type: Boolean, default: false }
  },
  { usePushEach: true }
);

releaseSchema.index({
  artistName: 'text',
  releaseTitle: 'text',
  'trackList.trackTitle': 'text',
  tags: 'text'
});

releaseSchema.post('save', release => {
  release.updateOne({ dateUpdated: Date.now() }).exec();
});

releaseSchema.set('toJSON', {
  transform: function (doc, ret) {
    delete ret.dateCreated;
    delete ret.dateUpdated;
    delete ret.artwork.dateCreated;
    delete ret.artwork.dateUpdated;

    ret.trackList.forEach(track => {
      delete track.dateCreated;
      delete track.dateUpdated;
      delete track.initRange;
      delete track.mpd;
      delete track.segmentDuration;
      delete track.segmentList;
      delete track.segmentTimescale;
    });

    return ret;
  }
});

mongoose.model('releases', releaseSchema);
