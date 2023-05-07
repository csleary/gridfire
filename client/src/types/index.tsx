export interface BasketItem {
  price: string;
  releaseId?: string;
  trackId?: string;
  trackTitle: string;
}

export interface EditionPurchase {
  allowanceTooLow?: boolean;
  editionId: bigint;
  price: bigint;
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

export interface Release {
  _id: string;
  artist: string;
  artistName: string;
  artwork: { status: string };
  catNumber: string;
  info: string;
  price: string;
  purchaseId?: string;
  recordLabel: string;
  releaseTitle: string;
  trackList: Array<ReleaseTrack>;
}

export interface ReleaseTrack {
  _id: string;
  duration: number;
  isBonus?: boolean;
  isEditionOnly?: boolean;
  price: string;
  trackTitle: string;
}

export interface Sale {
  release: string;
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
