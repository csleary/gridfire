export interface GridFireEdition {
  allowanceTooLow?: boolean;
  amount?: bigint;
  balance?: bigint;
  editionId: bigint;
  metadata: { description: string; properties: { tracks: [{ id: string; title: string }] } };
  price: bigint;
  uri?: string;
}

export interface GridFireEditionPurchase {
  allowanceTooLow?: boolean;
  editionId: bigint;
  price: bigint;
}

export interface MintedGridFireEdition extends GridFireEdition {
  allowanceTooLow: boolean;
  amount: bigint;
  balance: bigint;
  uri: string;
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
