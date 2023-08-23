import { IRelease } from "gridfire-web3-events/models/Release.js";
import { SaleType } from "gridfire-web3-events/models/Sale.js";
import { IUser } from "gridfire-web3-events/models/User.js";

enum ErrorCodes {
  REPLY_SUCCESS = 200,
  CONNECTION_FORCED = 320
}

enum NotificationType {
  Mint = "mintedEvent",
  Purchase = "purchaseEvent",
  Sale = "saleEvent",
  PurchaseEdition = "purchaseEditionEvent"
}

interface MessageTuple extends Array<string | Buffer> {
  0: string;
  1: string;
  2: Buffer;
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

interface RecordSaleParams {
  amountPaid: bigint;
  artistShare: bigint;
  platformFee: bigint;
  releaseId: string;
  transactionReceipt: any;
  type: SaleType;
  userId: string;
}

type PurchasedRelease = Promise<{
  release: ReleaseSingle | ReleaseAlbum;
  releaseTitle: string;
  type: SaleType;
}>;

type ReleaseSingle = Pick<IRelease, "artist" | "artistName" | "trackList"> & {
  user: Pick<IUser, "_id" | "paymentAddress">;
};

type ReleaseAlbum = Pick<IRelease, "artist" | "artistName" | "price" | "releaseTitle"> & {
  user: Pick<IUser, "_id" | "paymentAddress">;
};

interface SaleNotification {
  artistName: string;
  artistShare: string;
  buyerAddress: string;
  platformFee: string;
  releaseTitle: string;
  type: NotificationType.Sale;
  userId: string;
}

interface ValidatePurchaseParams {
  amountPaid: bigint;
  artistAddress: string;
  transactionHash: string;
  releaseId: string;
  userId: string;
}

export {
  ErrorCodes,
  MessageTuple,
  MintNotification,
  Notification,
  NotificationType,
  PurchasedRelease,
  PurchaseEditionNotification,
  PurchaseNotification,
  RecordSaleParams,
  ReleaseSingle,
  ReleaseAlbum,
  SaleNotification,
  ValidatePurchaseParams
};
