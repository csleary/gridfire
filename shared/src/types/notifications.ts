import type { AmqpMessage } from "@gridfire/shared/types/messages";

/**
 * Contract event notifications.
 */

enum NotificationType {
  Approval = "approvalEvent",
  Claim = "claimEvent",
  Mint = "mintedEvent",
  Purchase = "purchaseEvent",
  PurchaseEdition = "purchaseEditionEvent",
  Sale = "saleEvent"
}

interface ApprovalNotification extends AmqpMessage {
  type: NotificationType.Approval;
  userId: string;
}

interface ClaimNotification extends AmqpMessage {
  type: NotificationType.Claim;
  userId: string;
}

interface MintNotification extends AmqpMessage {
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

interface PurchaseEditionNotification extends AmqpMessage {
  artistName: string;
  releaseTitle: string;
  type: NotificationType.PurchaseEdition;
  userId: string;
}

interface PurchaseNotification extends AmqpMessage {
  artistName: string;
  releaseTitle: string;
  type: NotificationType.Purchase;
  userId: string;
}

interface SaleNotification extends AmqpMessage {
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
