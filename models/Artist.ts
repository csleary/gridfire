import { ObjectId, Schema, Types, model } from "mongoose";

interface ILink {
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
  title: { type: String, trim: true, default: "" },
  uri: { type: String, trim: true, default: "" }
});

const { ObjectId } = Schema.Types;

const artistSchema = new Schema<IArtist>(
  {
    user: { type: ObjectId, ref: "User" },
    name: { type: String, trim: true },
    slug: { type: String, trim: true },
    biography: { type: String, trim: true },
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

const Artist = model<IArtist>("Artist", artistSchema, "artists");

export default Artist;
