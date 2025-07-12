import { model, Schema, Types } from "mongoose";

export enum ReleaseStatus {
  Pending = "pending",
  Stored = "stored",
  Storing = "storing"
}

export enum TrackStatus {
  Deleting = "deleting",
  Encoded = "encoded",
  Encoding = "encoding",
  Error = "error",
  Pending = "pending",
  Stored = "stored",
  Transcoding = "transcoding",
  Uploaded = "uploaded",
  Uploading = "uploading"
}

export interface IRelease {
  artist: Types.ObjectId;
  artistName: string;
  artwork: {
    dateCreated: Date;
    dateUpdated: Date;
    status: ReleaseStatus;
  };
  catNumber: string;
  credits: string;
  info: string;
  price: string;
  published: boolean;
  pubName: string;
  pubYear: number;
  recName: string;
  recordLabel: string;
  recYear: number;
  releaseDate: Date;
  releaseTitle: string;
  tags: string[];
  trackList: ITrack[];
  user: Types.ObjectId;
}

export interface ITrack {
  _id: Types.ObjectId;
  duration: number;
  isBonus: boolean;
  isEditionOnly: boolean;
  position: number;
  price: string;
  status: TrackStatus;
  trackTitle: string;
}

const trackSchema = new Schema<ITrack>(
  {
    duration: { trim: true, type: Number },
    isBonus: { type: Boolean },
    isEditionOnly: { type: Boolean },
    position: { select: false, type: Number },
    price: { default: "1.50", type: String },
    status: { default: TrackStatus.Pending, enum: TrackStatus, type: String },
    trackTitle: { trim: true, type: String }
  },
  { timestamps: true }
);

const releaseSchema = new Schema<IRelease>(
  {
    artist: { ref: "Artist", type: Schema.Types.ObjectId },
    artistName: { trim: true, type: String },
    artwork: {
      dateCreated: { type: Date },
      dateUpdated: { type: Date },
      status: {
        default: ReleaseStatus.Pending,
        enum: ReleaseStatus,
        type: String
      }
    },
    catNumber: { trim: true, type: String },
    credits: { trim: true, type: String },
    info: { trim: true, type: String },
    price: { type: String },
    published: { default: false, type: Boolean },
    pubName: { trim: true, type: String },
    pubYear: { trim: true, type: Number },
    recName: { trim: true, type: String },
    recordLabel: { trim: true, type: String },
    recYear: { trim: true, type: Number },
    releaseDate: { type: Date },
    releaseTitle: { trim: true, type: String },
    tags: [String],
    trackList: [trackSchema],
    user: { ref: "User", type: Schema.Types.ObjectId }
  },
  { timestamps: true }
);

releaseSchema.post("save", release => {
  release.updateOne({ dateUpdated: Date.now() }).exec();
});

export default model("Release", releaseSchema, "releases");
