enum MessageType {
  ArtworkUploaded = "artworkUploaded",
  EncodingProgressFLAC = "encodingProgressFLAC",
  MintedEvent = "mintedEvent",
  Notify = "notify",
  PipelineError = "pipelineError",
  PurchaseEditionEvent = "purchaseEditionEvent",
  PurchaseEvent = "purchaseEvent",
  SaleEvent = "saleEvent",
  StoringProgressFLAC = "storingProgressFLAC",
  TrackStatus = "trackStatus",
  TranscodingCompleteAAC = "transcodingCompleteAAC",
  TranscodingCompleteMP3 = "transcodingCompleteMP3",
  TranscodingStartedAAC = "transcodingStartedAAC",
  TranscodingStartedMP3 = "transcodingStartedMP3",
  WorkerMessage = "workerMessage"
}

type MessageArtworkUploaded = RabbitmqMessage;

interface MessageEncodingError extends RabbitmqMessage {
  releaseId: string;
  stage: string;
  trackId: string;
}

interface MessageEncodingProgress extends RabbitmqMessage {
  progress: number;
  trackId: string;
}

interface MessageTrackStatus extends RabbitmqMessage {
  releaseId: string;
  status: string;
  trackId: string;
}

interface MessageTranscoding extends RabbitmqMessage {
  trackId: string;
  trackTitle: string;
}

interface MessageWorkerNotification extends RabbitmqMessage {
  message: string;
  title: string;
  type: MessageType.WorkerMessage;
}

interface RabbitmqMessage {
  type: MessageType;
  userId?: string;
}

type ServerSentMessage =
  | MessageArtworkUploaded
  | MessageEncodingError
  | MessageEncodingProgress
  | MessageTrackStatus
  | MessageTranscoding
  | MessageWorkerNotification;

export { MessageType };
export type {
  MessageEncodingError,
  MessageEncodingProgress,
  MessageTrackStatus,
  MessageTranscoding,
  MessageWorkerNotification,
  RabbitmqMessage,
  ServerSentMessage
};
