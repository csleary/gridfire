enum NotificationType {
  Approval = "approvalEvent",
  Claim = "claimEvent",
  Mint = "mintedEvent",
  Purchase = "purchaseEvent",
  PurchaseEdition = "purchaseEditionEvent",
  Sale = "saleEvent"
}

interface ApprovalNotification {
  type: NotificationType.Approval;
  userId: string;
}

interface ClaimNotification {
  type: NotificationType.Claim;
  userId: string;
}

interface MintNotification {
  editionId: string;
  type: NotificationType.Mint;
  userId: string;
}

type Notification =
  | ApprovalNotification
  | ClaimNotification
  | MintNotification
  | PurchaseEditionNotification
  | PurchaseNotification
  | SaleNotification;

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

interface SaleNotification {
  artistName: string;
  artistShare: string;
  buyerAddress: string;
  platformFee: string;
  releaseTitle: string;
  type: NotificationType.Sale;
  userId: string;
}

export type {
  ApprovalNotification,
  ClaimNotification,
  MintNotification,
  Notification,
  PurchaseEditionNotification,
  PurchaseNotification,
  SaleNotification
};
export { NotificationType };
