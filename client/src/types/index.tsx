export interface BasketItem {
  price: string;
  releaseId?: string;
  trackId?: string;
  trackTitle: string;
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

export interface EssentialReleaseValues {
  artist: string;
  artistName: string;
  releaseTitle: string;
  releaseDate: string;
  price: string;
}

export interface ListItem {
  _id: string;
  dateAdded: Date;
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
}

export interface ReleaseErrors {
  artistName: string;
  releaseTitle: string;
  releaseDate: string;
  price: string;
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
  release: string;
}

export interface TrackErrors {
  [trackId: string]: string;
}

export interface TrackForPurchase {
  price: string;
  trackId: string;
}

export interface UserListItem {
  _id: string;
  dateAdded: Date;
  release: string;
  note?: string;
}
