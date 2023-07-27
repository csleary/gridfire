import { Schema, Types, model } from "mongoose";

enum EditionStatus {
  Pending = "pending",
  Minted = "minted"
}

interface IEdition {
  release: Types.ObjectId;
  editionId: string;
  amount: string;
  price: string;
  status: EditionStatus;
  metadata: object;
  cid: string;
}

const editionSchema = new Schema<IEdition>(
  {
    release: { type: Schema.Types.ObjectId, ref: "Release", required: true },
    editionId: { type: String },
    amount: { type: String, required: true },
    price: { type: String, required: true },
    status: { type: String, enum: EditionStatus, default: EditionStatus.Pending },
    metadata: { type: Object, required: true },
    cid: { type: String, required: true }
  },
  { timestamps: true }
);

editionSchema.index({ release: 1 });

const Edition = model("Edition", editionSchema, "editions");

export default Edition;
