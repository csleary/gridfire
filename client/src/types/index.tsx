export interface EditionPurchase {
  allowanceTooLow?: boolean;
  editionId: bigint;
  price: bigint;
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
  mp4: string | boolean;
  price: string;
  trackTitle: string;
}

export interface ListItem {
  _id: string;
  dateAdded: Date;
  release: ReleaseTrack;
  note?: string;
}
