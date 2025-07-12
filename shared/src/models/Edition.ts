import { model, Schema, Types } from "mongoose";

enum EditionStatus {
  Minted = "minted",
  Pending = "pending"
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
    description: string;
    external_url: string;
    image: string;
    name: string;
    properties: {
      artist: string;
      info: string;
      price: string;
      priceInDai: string;
      releaseDate: string;
      title: string;
      totalSupply: number;
      tracks: [{ id: string; title: string }];
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
    amount: { required: true, type: String },
    cid: { required: true, type: String },
    editionId: { type: String },
    metadata: { required: true, type: Object },
    price: { required: true, type: String },
    release: { ref: "Release", required: true, type: ObjectId },
    status: { default: EditionStatus.Pending, enum: EditionStatus, type: String },
    user: { ref: "User", required: true, type: ObjectId },
    visibility: { default: EditionVisibility.Visible, enum: EditionVisibility, type: String }
  },
  { timestamps: true }
);

editionSchema.index({ editionId: 1 });
editionSchema.index({ release: 1 });

export { EditionStatus };
export type { EditionVisibility, IEdition };
export default model<IEdition>("Edition", editionSchema, "editions");
