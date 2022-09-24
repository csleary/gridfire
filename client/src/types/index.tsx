import { BigNumber } from "ethers";

export interface GridFireEdition {
  allowanceTooLow?: boolean;
  amount?: BigNumber;
  balance?: BigNumber;
  editionId: BigNumber;
  price: BigNumber;
  uri?: string;
}
