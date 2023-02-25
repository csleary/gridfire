import { BigNumber } from "ethers";

export interface GridFireEdition {
  allowanceTooLow?: boolean;
  amount?: BigNumber;
  balance?: BigNumber;
  editionId: BigNumber;
  metadata: { description: string; properties: { tracks: [{ id: string; title: string }] } };
  price: BigNumber;
  uri?: string;
}

export interface MintedGridFireEdition {
  amount: BigNumber;
  balance: BigNumber;
  editionId: BigNumber;
  price: BigNumber;
  metadata: {
    description: string;
    properties: {
      tracks: [{ id: string; title: string }];
    };
  };
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
