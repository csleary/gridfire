import { IRelease } from "@gridfire/shared/models/Release";
import { SaleType } from "@gridfire/shared/models/Sale";
import { IUser } from "@gridfire/shared/models/User";
import "express";
import type { Request } from "express";
import { JSONRPCResponse } from "json-rpc-2.0";
import { ObjectId } from "mongoose";

declare global {
  namespace Express {
    interface User extends IUser {}
  }
}

declare module "express" {
  interface Request {
    user?: Express.User;
  }
}

interface AuthenticatedRequest extends Request {
  user: IUser;
}

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

interface Contract {
  address: string;
  abi: any;
  eventNames: string[];
}

interface Link {
  _id?: ObjectId;
  title: string;
  uri: string;
}

enum NotificationType {
  Mint = "mintedEvent",
  Purchase = "purchaseEvent",
  Sale = "saleEvent",
  PurchaseEdition = "purchaseEditionEvent"
}

interface MintNotification {
  editionId: string;
  type: NotificationType.Mint;
  userId: string;
}

type Notification = MintNotification | PurchaseEditionNotification | PurchaseNotification | SaleNotification;

interface PurchaseEditionNotification {
  artistName: string;
  releaseTitle: string;
  type: NotificationType.PurchaseEdition;
  userId: string;
}

interface PurchaseNotification {
  artistName: string;
  releaseTitle: string;
  type: NotificationType.Purchase;
  userId: string;
}

type PurchasedRelease = Promise<{
  release: ReleaseSingle | ReleaseAlbum;
  releaseTitle: string;
  type: SaleType;
}>;

type Provider = readonly [name: symbol, url: string];

type ProviderRequest = { method: string; params: any[] };

interface ProviderResult {
  provider: symbol;
  data: JSONRPCResponse[];
  error: any;
}

interface RecordSaleParams {
  amountPaid: bigint;
  artistAddress: string;
  artistShare: bigint;
  logIndex: string;
  platformFee: bigint;
  releaseId: string;
  transactionReceipt: any;
  type: SaleType;
  userId: string;
}

interface ReleaseContext extends TrackContext {
  releaseId: string;
  trackTitle: string;
}

type ReleaseAlbum = Omit<Pick<IRelease, "artist" | "artistName" | "price" | "releaseTitle">, "user"> & {
  user: Pick<IUser, "_id" | "paymentAddress">;
};

type ReleaseSingle = Omit<Pick<IRelease, "artist" | "artistName" | "trackList">, "user"> & {
  user: Pick<IUser, "_id" | "paymentAddress">;
};

type RequestOptions = { timeout?: number };

interface SaleNotification {
  artistName: string;
  artistShare: string;
  buyerAddress: string;
  platformFee: string;
  releaseTitle: string;
  type: NotificationType.Sale;
  userId: string;
}

interface TrackContext {
  trackId: string;
  userId: string;
}

interface ValidatePurchaseParams {
  amountPaid: bigint;
  artistAddress: string;
  releaseId: string;
}

export { NotificationType };
export type {
  AuthenticatedRequest,
  BasketItem,
  Contract,
  Link,
  MintNotification,
  Notification,
  Provider,
  ProviderRequest,
  ProviderResult,
  PurchasedRelease,
  PurchaseEditionNotification,
  PurchaseNotification,
  RecordSaleParams,
  ReleaseAlbum,
  ReleaseContext,
  ReleaseSingle,
  Request,
  RequestOptions,
  SaleNotification,
  TrackContext,
  ValidatePurchaseParams
};
