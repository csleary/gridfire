import { Schema, Types, model } from "mongoose";

enum EditionStatus {
  Pending = "pending",
  Minted = "minted"
}

enum EditionVisibility {
  Hidden = "hidden",
  Visible = "visible"
}

interface IEdition {
  amount: string;
  cid: string;
  editionId: string;
  metadata: {
    attributes: {
      display_type: string;
      trait_type: string;
      value: number;
    };
    name: string;
    description: string;
    external_url: string;
    image: string;
    properties: {
      artist: string;
      title: string;
      totalSupply: number;
      tracks: [{ id: string; title: string }];
      price: string;
      priceInDai: string;
      releaseDate: string;
      info: string;
    };
  };
  price: string;
  release: Types.ObjectId;
  status: EditionStatus;
  user: Types.ObjectId;
  visibility: EditionVisibility;
}

const { ObjectId } = Schema.Types;

const editionSchema = new Schema<IEdition>(
  {
    amount: { type: String, required: true },
    cid: { type: String, required: true },
    editionId: { type: String },
    metadata: { type: Object, required: true },
    price: { type: String, required: true },
    release: { type: ObjectId, ref: "Release", required: true },
    status: { type: String, enum: EditionStatus, default: EditionStatus.Pending },
    user: { type: ObjectId, ref: "User", required: true },
    visibility: { type: String, enum: EditionVisibility, default: EditionVisibility.Visible }
  },
  { timestamps: true }
);

editionSchema.index({ editionId: 1 });
editionSchema.index({ release: 1 });

export { EditionStatus };
export type { EditionVisibility, IEdition };
export default model<IEdition>("Edition", editionSchema, "editions");
