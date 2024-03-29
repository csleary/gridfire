import { ObjectId, Schema, model } from "mongoose";

enum EditionStatus {
  Pending = "pending",
  Minted = "minted"
}

export interface IEdition {
  _id: ObjectId;
  release: ObjectId;
  editionId: string;
  amount: string;
  price: string;
  status: EditionStatus;
  metadata: object;
  cid: string;
}

const { ObjectId } = Schema.Types;

const editionSchema = new Schema<IEdition>(
  {
    release: { type: ObjectId, ref: "Release", required: true },
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
