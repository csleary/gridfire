import { Model, ObjectId, Schema, Types, model } from "mongoose";

interface ILink {
  _id: ObjectId;
  title: string;
  uri: string;
}

interface IArtist {
  user: ObjectId;
  name: string;
  slug: string;
  biography: string;
  links: Types.Array<ILink>;
}

const linkSchema = new Schema<ILink>({
  title: { type: String, trim: true, default: "", maxLength: 100 },
  uri: { type: String, trim: true, default: "", maxLength: 100 }
});

type ArtistDocumentProps = {
  links: Types.DocumentArray<ILink>;
};

type ArtistModelType = Model<IArtist, {}, ArtistDocumentProps>;

const artistSchema = new Schema<IArtist>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User" },
    name: { type: String, trim: true, maxLength: 100 },
    slug: { type: String, trim: true, maxLength: 50 },
    biography: { type: String, trim: true, maxLength: 2000 },
    links: [linkSchema]
  },
  { timestamps: true }
);

artistSchema.index(
  { slug: 1 },
  {
    unique: true,
    partialFilterExpression: {
      slug: { $exists: true, $type: "string" }
    },
    collation: {
      locale: "en",
      strength: 2
    }
  }
);

artistSchema.post("save", release => {
  release.updateOne({ dateUpdated: Date.now() }).exec();
});

artistSchema.set("toJSON", { versionKey: false });

const Artist = model<IArtist, ArtistModelType>("Artist", artistSchema, "artists");

export default Artist;
export type { ILink, IArtist, ArtistModelType };
