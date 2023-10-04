import { IUser } from "gridfire/models/User.js";
import { ObjectId } from "mongoose";
import { Request } from "express";

interface BasketItem {
  artistName: string;
  imageUrl: string;
  paymentAddress: string;
  price: bigint;
  title: string;
  trackId?: string; // For track purchases.
  trackTitle?: string; // For track purchases.
  releaseId: string;
}

enum ErrorCodes {
  REPLY_SUCCESS = 200,
  CONNECTION_FORCED = 320
}

interface Link {
  _id?: ObjectId;
  title: string;
  uri: string;
}

interface MessageTuple extends Array<string | Buffer> {
  0: string;
  1: string;
  2: Buffer;
}

interface AuthenticatedRequest extends Request {
  user: IUser;
}

export { AuthenticatedRequest, BasketItem, ErrorCodes, Link, MessageTuple };
