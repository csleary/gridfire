const mongoose = require("mongoose");

const { Schema } = mongoose;

const releaseSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User" },
    artist: { type: Schema.Types.ObjectId, ref: "Artist" },
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
        hasAudio: { type: Boolean, default: false },
        duration: { type: Number, trim: true }
      }
    ],
    tags: [String],
    dateCreated: Date,
    published: { type: Boolean, default: false }
  },
  {
    usePushEach: true
  }
);

releaseSchema.index({
  artistName: "text",
  releaseTitle: "text",
  "trackList.trackTitle": "text",
  tags: "text"
});

mongoose.model("releases", releaseSchema);
