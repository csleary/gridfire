import { Request } from "express";
import { IUser } from "gridfire/models/User.js";

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
  _id: string;
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
