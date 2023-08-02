import { Schema, Types, model } from "mongoose";

enum EditionStatus {
  Minted = "minted",
  Pending = "pending"
}

enum EditionVisibility {
  Hidden = "hidden",
  Visible = "visible"
}

export interface IEdition {
  amount: string;
  cid: string;
  editionId: string;
  metadata: object;
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

const Edition = model<IEdition>("Edition", editionSchema, "editions");

export default Edition;
