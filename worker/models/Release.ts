import { Schema, Types, model } from "mongoose";

enum TrackStatus {
  Pending = "pending",
  Uploading = "uploading",
  Uploaded = "uploaded",
  Encoding = "encoding",
  Encoded = "encoded",
  Transcoding = "transcoding",
  Stored = "stored",
  Error = "error",
  Deleting = "deleting"
}

enum ReleaseStatus {
  Pending = "pending",
  Storing = "storing",
  Stored = "stored"
}

interface ITrack {
  position: number;
  trackTitle: string;
  status: TrackStatus;
  duration: number;
  isBonus: boolean;
  isEditionOnly: boolean;
  price: string;
}

export interface IRelease {
  user: Types.ObjectId;
  artist: Types.ObjectId;
  artistName: string;
  releaseTitle: string;
  artwork: {
    dateCreated: Date;
    dateUpdated: Date;
    status: ReleaseStatus;
  };
  releaseDate: Date;
  price: string;
  recordLabel: string;
  catNumber: string;
  credits: string;
  info: string;
  pubYear: number;
  pubName: string;
  recYear: number;
  recName: string;
  trackList: ITrack[];
  tags: string[];
  published: boolean;
}

const trackSchema = new Schema<ITrack>(
  {
    position: { type: Number, select: false },
    trackTitle: { type: String, trim: true },
    status: { type: String, enum: TrackStatus, default: TrackStatus.Pending },
    duration: { type: Number, trim: true },
    isBonus: { type: Boolean },
    isEditionOnly: { type: Boolean },
    price: { type: String, default: "1.50" }
  },
  { timestamps: true }
);

const releaseSchema = new Schema<IRelease>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User" },
    artist: { type: Schema.Types.ObjectId, ref: "Artist" },
    artistName: { type: String, trim: true },
    releaseTitle: { type: String, trim: true },
    artwork: {
      dateCreated: { type: Date },
      dateUpdated: { type: Date },
      status: {
        type: String,
        enum: ReleaseStatus,
        default: ReleaseStatus.Pending
      }
    },
    releaseDate: { type: Date },
    price: { type: String },
    recordLabel: { type: String, trim: true },
    catNumber: { type: String, trim: true },
    credits: { type: String, trim: true },
    info: { type: String, trim: true },
    pubYear: { type: Number, trim: true },
    pubName: { type: String, trim: true },
    recYear: { type: Number, trim: true },
    recName: { type: String, trim: true },
    trackList: [trackSchema],
    tags: [String],
    published: { type: Boolean, default: false }
  },
  { timestamps: true }
);

releaseSchema.post("save", release => {
  release.updateOne({ dateUpdated: Date.now() }).exec();
});

const Release = model("Release", releaseSchema, "releases");

export default Release;
