import { Model, model, ObjectId, Schema, Types } from "mongoose";

interface IArtist {
  biography: string;
  links: Types.Array<ILink>;
  name: string;
  slug: string;
  user: ObjectId;
}

interface ILink {
  _id: ObjectId;
  title: string;
  uri: string;
}

const linkSchema = new Schema<ILink>({
  title: { default: "", maxLength: 100, trim: true, type: String },
  uri: { default: "", maxLength: 100, trim: true, type: String }
});

type ArtistDocumentProps = {
  links: Types.DocumentArray<ILink>;
};

type ArtistModelType = Model<IArtist, object, ArtistDocumentProps>;

const artistSchema = new Schema<IArtist>(
  {
    biography: { maxLength: 2000, trim: true, type: String },
    links: [linkSchema],
    name: { maxLength: 100, trim: true, type: String },
    slug: { maxLength: 50, trim: true, type: String },
    user: { ref: "User", type: Schema.Types.ObjectId }
  },
  { timestamps: true }
);

artistSchema.index(
  { slug: 1 },
  {
    collation: {
      locale: "en",
      strength: 2
    },
    partialFilterExpression: {
      slug: { $exists: true, $type: "string" }
    },
    unique: true
  }
);

artistSchema.post("save", release => {
  release.updateOne({ dateUpdated: Date.now() }).exec();
});

artistSchema.set("toJSON", { versionKey: false });

export type { IArtist, ILink };
export default model<IArtist, ArtistModelType>("Artist", artistSchema, "artists");
