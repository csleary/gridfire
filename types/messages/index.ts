type ServerSentMessage =
  | Message
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

interface MessageEncodingError extends Message {
  releaseId: string;
  stage: string;
  trackId: string;
}

interface MessageTranscoding extends Message {
  trackId: string;
  trackName?: string;
}

interface MessageTrackStatus extends Message {
  releaseId: string;
  status: string;
  trackId: string;
}

interface MessageEncodingProgress extends Message {
  progress: number;
  trackId: string;
}

interface MessageWorkerNotification {
  message: string;
  title: string;
  type: MessageType.WorkerMessage;
}

interface Message {
  type: MessageType;
}

export {
  Message,
  MessageEncodingError,
  MessageEncodingProgress,
  MessageTrackStatus,
  MessageTranscoding,
  MessageType,
  MessageWorkerNotification,
  ServerSentMessage
};
