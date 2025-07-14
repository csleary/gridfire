import { IRelease } from "@gridfire/shared/models/Release";
import { SaleType } from "@gridfire/shared/models/Sale";
import { IUser } from "@gridfire/shared/models/User";
import { InterfaceAbi, TransactionReceipt } from "ethers";
import { JSONRPCResponse } from "json-rpc-2.0";
import { ObjectId } from "mongoose";
export type { ConnectFunction, ConnectOptions, MessageHandler } from "@gridfire/shared/types/amqp";
export type {
  AmqpMessage,
  BlockRangeMessage,
  JobMessage,
  KeepAliveMessage,
  MessageEncodingError,
  MessageEncodingProgress,
  MessageTrackStatus,
  MessageTranscoding,
  MessageWorkerNotification,
  ServerSentMessage,
  ServerSentMessagePayload
} from "@gridfire/shared/types/messages";
export { MessageType } from "@gridfire/shared/types/messages";
export { NotificationType } from "@gridfire/shared/types/notifications";
export type {
  ApprovalNotification,
  ClaimNotification,
  MintNotification,
  Notification,
  PurchaseEditionNotification,
  PurchaseNotification,
  SaleNotification
} from "@gridfire/shared/types/notifications";

enum ActiveProcessType {
  Mint = "mint",
  Purchase = "purchase",
  Upload = "upload"
}

enum ActivityType {
  Favourite = "favourite",
  Follow = "follow",
  Mint = "mint",
  Publish = "publish",
  Sale = "sale"
}

enum EventNames {
  APPROVAL = "Approval",
  CLAIM = "Claim",
  EDITION_MINTED = "EditionMinted",
  PURCHASE = "Purchase",
  PURCHASE_EDITION = "PurchaseEdition",
  TRANSFER_SINGLE = "TransferSingle"
}

interface ActiveProcess {
  description: string;
  id: string;
  type: ActiveProcessType;
}

type Activity = ActivityFavourite | ActivityFollow | ActivityMint | ActivitySale | ActivitySaleEdition;

interface ActivityBase {
  _id: string;
  account: string;
  artist: string;
  artistName: string;
  createdAt: string;
  type: ActivityType;
  user: string;
  username: string;
}

interface ActivityFavourite extends ActivityBase {
  releaseTitle: string;
  type: ActivityType.Favourite;
}

interface ActivityFollow extends ActivityBase {
  type: ActivityType.Follow;
}

interface ActivityMint extends ActivityBase {
  editionId: string;
  type: ActivityType.Mint;
}

interface ActivitySale extends ActivityBase {
  amountPaid: string;
  release: string;
  releaseTitle: string;
  sale: string;
  type: ActivityType.Sale;
}

interface ActivitySaleEdition extends ActivitySale {
  editionDescription: string;
}

interface Artist {
  _id: string;
  biography: string;
  links: Link[];
  name: string;
  releases: Release[];
  slug: string;
}

interface AuthenticatedRequest extends Request {
  user: IUser;
}

interface BasketItem {
  artistName: string;
  imageUrl: string;
  paymentAddress: string;
  price: bigint;
  releaseId: string;
  title: string;
  trackId?: string; // For track purchases.
  trackTitle?: string; // For track purchases.
}

interface CollectionEdition extends CollectionRelease {
  metadata: { description: string; properties: { tracks: [{ id: string; title: string }] } };
}

interface CollectionRelease {
  _id: string;
  paid: string;
  purchaseDate: string;
  purchaseId: string;
  release: Release;
  transactionHash: string;
}

interface CollectionSingle extends CollectionRelease {
  trackId: string;
}

interface DetailedReleaseValues {
  catNumber: string;
  credits: string;
  info: string;
  pubName: string;
  pubYear: string;
  recName: string;
  recordLabel: string;
  recYear: string;
  tags: string[];
}

interface EditionPurchase {
  allowanceTooLow?: boolean;
  editionId: bigint;
  price: bigint;
}

type EditorRelease = Omit<Release, "trackList">;

interface EssentialReleaseValues {
  artist: string;
  artistName: string;
  price: string;
  releaseDate: string;
  releaseTitle: string;
}

type EventFilters = unknown[];

interface Favourite {
  _id: string;
  dateAdded: string;
  release: Release;
  trackId?: string;
  user: string;
}

interface GridfireContract {
  abi: InterfaceAbi;
  address: string;
  events: Map<EventNames, EventFilters>;
}

interface Link {
  _id: ObjectId;
  title: string;
  uri: string;
}

interface ListItem {
  _id: string;
  dateAdded: string;
  note?: string;
  release: Release;
}

interface MintedEdition {
  allowanceTooLow: boolean;
  amount: bigint;
  balance: bigint;
  editionId: bigint;
  metadata: { description: string; properties: { tracks: [{ id: string; title: string }] } };
  price: bigint;
  uri: string;
  visibility: "hidden" | "visible";
}

type ProviderRequest = { method: string; params: unknown[] };

interface ProviderResponse {
  data: JSONRPCResponse[];
  error: unknown;
  provider: symbol;
}

type Providers = Map<symbol, string>;

interface Purchase {
  artistShare: bigint;
  blockNumber: number;
  editionId: bigint;
  logIndex: string;
  platformFee: bigint;
  releaseId: string;
  transactionHash: string;
  userAddress: string;
}

type PurchasedRelease = {
  purchaseId: string;
  release: ReleaseAlbum | ReleaseSingle;
  releaseTitle: string;
  type: SaleType;
};

interface RecordSaleParams {
  amountPaid: bigint;
  artistAddress: string;
  artistShare: bigint;
  editionId?: string;
  logIndex: string;
  platformFee: bigint;
  releaseId: string;
  transactionHash: string;
  transactionReceipt: TransactionReceipt;
  type: SaleType;
  userId: string;
}

interface Release {
  _id: string;
  artist: string;
  artistName: string;
  artwork: { status: string };
  catNumber: string;
  credits: string;
  info: string;
  price: string;
  published: boolean;
  pubName: string;
  pubYear: string;
  recName: string;
  recordLabel: string;
  recYear: string;
  releaseDate: string;
  releaseTitle: string;
  tags: string[];
  trackList: ReleaseTrack[];
}

type ReleaseAlbum = Omit<Pick<IRelease, "artist" | "artistName" | "price" | "releaseTitle">, "user"> & {
  user: Pick<IUser, "_id" | "paymentAddress">;
};

interface ReleaseContext extends TrackContext {
  releaseId: string;
  trackTitle: string;
}

interface ReleaseErrors {
  artist: string;
  artistName: string;
  price: string;
  releaseDate: string;
  releaseTitle: string;
}

type ReleaseSingle = Omit<Pick<IRelease, "artist" | "artistName" | "trackList">, "user"> & {
  user: Pick<IUser, "_id" | "paymentAddress">;
};

interface ReleaseTrack {
  _id: string;
  duration: number;
  isBonus?: boolean;
  isEditionOnly?: boolean;
  price: string;
  status: string;
  trackTitle: string;
}

type RequestOptions = {
  quorum?: number; // Optionally override the quorum for this request.
  timeout?: number; // Axios cancellation timeout in milliseconds.
};

interface Sale {
  _id: string;
  paid: string;
  purchaseDate: string;
  release: string; // Album/track ID.
  transaction: TransactionReceipt;
}

type SalesHistory = Purchase[];

interface TrackContext {
  trackId: string;
  userId: string;
}

interface TrackErrors {
  [trackId: string]: string;
}

interface TrackForPurchase {
  price: string;
  trackId: string;
}

interface UserFavourite {
  _id: string;
  dateAdded: string;
  release: string;
  trackId?: string;
}

interface UserListItem {
  _id: string;
  dateAdded: string;
  note?: string;
  release: string;
}

interface UserRelease extends Release {
  faves: number;
  plays: number;
  sales: number;
}

interface ValidatePurchaseParams {
  amountPaid: bigint;
  artistAddress: string;
  releaseId: string;
}

export { ActiveProcessType, ActivityType, EventNames };

export type {
  ActiveProcess,
  Activity,
  ActivityFavourite,
  ActivityFollow,
  ActivityMint,
  ActivitySale,
  ActivitySaleEdition,
  Artist,
  AuthenticatedRequest,
  BasketItem,
  CollectionEdition,
  CollectionRelease,
  CollectionSingle,
  DetailedReleaseValues,
  EditionPurchase,
  EditorRelease,
  EssentialReleaseValues,
  EventFilters,
  Favourite,
  GridfireContract,
  Link,
  ListItem,
  MintedEdition,
  ProviderRequest,
  ProviderResponse,
  Providers,
  Purchase,
  PurchasedRelease,
  RecordSaleParams,
  Release,
  ReleaseAlbum,
  ReleaseContext,
  ReleaseErrors,
  ReleaseSingle,
  ReleaseTrack,
  RequestOptions,
  Sale,
  SalesHistory,
  TrackContext,
  TrackErrors,
  TrackForPurchase,
  UserFavourite,
  UserListItem,
  UserRelease,
  ValidatePurchaseParams
};
