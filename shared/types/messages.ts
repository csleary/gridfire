type ServerSentMessage =
  | MessageArtworkUploaded
  | MessageEncodingError
  | MessageEncodingProgress
  | MessageTrackStatus
  | MessageTranscoding
  | MessageWorkerNotification;

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

interface MessageArtworkUploaded extends RabbitmqMessage {}

interface MessageEncodingError extends RabbitmqMessage {
  releaseId: string;
  stage: string;
  trackId: string;
}

interface MessageTranscoding extends RabbitmqMessage {
  trackId: string;
  trackName?: string;
}

interface MessageTrackStatus extends RabbitmqMessage {
  releaseId: string;
  status: string;
  trackId: string;
}

interface MessageEncodingProgress extends RabbitmqMessage {
  progress: number;
  trackId: string;
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

export {
  MessageEncodingError,
  MessageEncodingProgress,
  MessageTrackStatus,
  MessageTranscoding,
  MessageType,
  MessageWorkerNotification,
  RabbitmqMessage,
  ServerSentMessage
};
