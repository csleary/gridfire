import { UUID } from "node:crypto";

enum MessageType {
  ArtworkUploaded = "artworkUploaded",
  BlockRange = "blockRange",
  EncodingProgressFLAC = "encodingProgressFLAC",
  Job = "job",
  Notify = "notify",
  Ping = "ping",
  PipelineError = "pipelineError",
  Pong = "pong",
  StoringProgressFLAC = "storingProgressFLAC",
  TrackStatus = "trackStatus",
  TranscodingCompleteAAC = "transcodingCompleteAAC",
  TranscodingCompleteMP3 = "transcodingCompleteMP3",
  TranscodingStartedAAC = "transcodingStartedAAC",
  TranscodingStartedMP3 = "transcodingStartedMP3",
  WorkerMessage = "workerMessage"
}

interface AmqpMessage {
  type: MessageType;
  userId: string;
}

interface BlockRangeMessage {
  fromBlock: string;
  toBlock: string;
  type: MessageType.BlockRange;
}

interface JobMessage {
  job: string;
  releaseId: string;
  trackId: string;
  trackTitle: string;
  type: MessageType.Job;
  userId: string;
}

interface KeepAliveMessage extends AmqpMessage {
  uuid: UUID;
}

type MessageArtworkUploaded = AmqpMessage;

interface MessageEncodingError extends AmqpMessage {
  releaseId: string;
  stage: string;
  trackId: string;
}

interface MessageEncodingProgress extends AmqpMessage {
  progress: number;
  trackId: string;
}

interface MessageTrackStatus extends AmqpMessage {
  releaseId: string;
  status: string;
  trackId: string;
}

interface MessageTranscoding extends AmqpMessage {
  trackId: string;
  trackTitle: string;
}

interface MessageWorkerNotification extends AmqpMessage {
  message: string;
  title: string;
  type: MessageType.WorkerMessage;
}

type ServerSentMessage =
  | MessageArtworkUploaded
  | MessageEncodingError
  | MessageEncodingProgress
  | MessageTrackStatus
  | MessageTranscoding
  | MessageWorkerNotification;

type ServerSentMessagePayload = Omit<ServerSentMessage, "userId">;

export type {
  AmqpMessage,
  BlockRangeMessage,
  JobMessage,
  KeepAliveMessage,
  MessageEncodingError,
  MessageEncodingProgress,
  MessageTrackStatus,
  MessageTranscoding,
  MessageWorkerNotification,
  ServerSentMessage,
  ServerSentMessagePayload
};
export { MessageType };
