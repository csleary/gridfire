export interface Activity {
  _id: string;
  account: string;
  amountPaid?: string;
  artist: string;
  artistName: string;
  createdAt: string;
  editionDescription?: string;
  editionId?: string;
  release?: string;
  releaseTitle?: string;
  sale?: string;
  type: "favourite" | "follow" | "mint" | "publish" | "sale";
  user: string;
  username: string;
}

export interface Artist {
  _id: string;
  name: string;
  slug: string;
  biography: string;
  links: Link[];
  releases?: Release[];
}

export interface BasketItem {
  artistName: string;
  imageUrl: string;
  paymentAddress: string;
  price: bigint;
  title: string;
  trackId?: string; // For track purchases.
  trackTitle?: string; // For track purchases.
  releaseId: string;
}

export interface Collection {
  albums: CollectionAlbum[];
  singles: CollectionSingle[];
}

export interface CollectionAlbum {
  _id: string;
  purchaseId: string;
  paid: string;
  purchaseDate: string;
  release: Release;
  transaction: any;
}

export interface CollectionSingle extends CollectionAlbum {
  trackId: string;
}

export interface DetailedReleaseValues {
  info: string;
  credits: string;
  recordLabel: string;
  catNumber: string;
  pubYear: string;
  pubName: string;
  recYear: string;
  recName: string;
  tags: string[];
}

export interface EditionPurchase {
  allowanceTooLow?: boolean;
  editionId: bigint;
  price: bigint;
}

export type EditorRelease = Omit<Release, "trackList">;

export interface EssentialReleaseValues {
  artist: string;
  artistName: string;
  releaseTitle: string;
  releaseDate: string;
  price: string;
}

export interface Favourite {
  _id: string;
  dateAdded: string;
  release: Release;
  trackId?: string;
  user: string;
}

export interface Link {
  _id: string;
  title: string;
  uri: string;
}

export interface ListItem {
  _id: string;
  dateAdded: string;
  release: Release;
  note?: string;
}

export interface MintedEdition {
  allowanceTooLow: boolean;
  amount: bigint;
  balance: bigint;
  editionId: bigint;
  metadata: { description: string; properties: { tracks: [{ id: string; title: string }] } };
  price: bigint;
  uri: string;
}

export interface Purchase {
  blockNumber: number;
  buyer: string;
  editionId: bigint;
  releaseId: string;
  artistShare: bigint;
  platformFee: bigint;
  transactionHash: string;
}

export type PurchaseHistory = Purchase[];

export interface PurchasedRelease extends Release {
  purchaseId: string;
}

export interface Release {
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
  releaseDate: string;
  recName: string;
  recordLabel: string;
  recYear: string;
  releaseTitle: string;
  tags: string[];
  trackList: ReleaseTrack[];
  [key: string]: any;
}

export interface ReleaseErrors {
  artistName: string;
  releaseTitle: string;
  releaseDate: string;
  price: string;
  [key: string]: any;
}

export interface ReleaseTrack {
  _id: string;
  duration: number;
  isBonus?: boolean;
  isEditionOnly?: boolean;
  price: string;
  status: string;
  trackTitle: string;
}

export interface Sale {
  _id: string;
  purchaseId: string;
  paid: string;
  purchaseDate: string;
  release: string; // Album/track ID.
  transaction: any;
}

export interface TrackErrors {
  [trackId: string]: string;
}

export interface TrackForPurchase {
  price: string;
  trackId: string;
}

export interface UserFavourite {
  _id: string;
  dateAdded: string;
  release: string;
  trackId?: string;
}

export interface UserListItem {
  _id: string;
  dateAdded: string;
  release: string;
  note?: string;
}

export interface UserRelease extends Release {
  faves: number;
  plays: number;
  sales: number;
}
