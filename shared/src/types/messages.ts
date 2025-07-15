import { NotificationType } from "@gridfire/shared/types/notifications";
import { UUID } from "node:crypto";

const isBlockRangeMessage = (msg: AmqpMessage): msg is BlockRangeMessage => "fromBlock" in msg && "toBlock" in msg;

const isJobOrBlockRangeMessage = (message: AmqpMessage): message is BlockRangeMessage | JobMessage =>
  ("fromBlock" in message && "toBlock" in message) || "job" in message;
const isJobMessage = (message: AmqpMessage): message is JobMessage => "job" in message;

const isKeepAliveMessage = (message: AmqpMessage): message is KeepAliveMessage =>
  "userId" in message && "uuid" in message;

const isServerSentMessage = (message: AmqpMessage): message is ServerSentMessage =>
  [
    MessageType.ArtworkUploaded,
    MessageType.EncodingProgressFLAC,
    MessageType.Notify,
    MessageType.PipelineError,
    MessageType.StoringProgressFLAC,
    MessageType.TrackStatus,
    MessageType.TranscodingCompleteAAC,
    MessageType.TranscodingCompleteMP3,
    MessageType.TranscodingStartedAAC,
    MessageType.TranscodingStartedMP3,
    MessageType.WorkerMessage,
    NotificationType.Approval,
    NotificationType.Claim,
    NotificationType.Mint,
    NotificationType.Purchase,
    NotificationType.PurchaseEdition,
    NotificationType.Sale
  ].includes(message.type);

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
  type: MessageType | NotificationType;
}

interface BlockRangeMessage extends Omit<AmqpMessage, "userId"> {
  fromBlock: string;
  toBlock: string;
  type: MessageType.BlockRange;
}

interface JobMessage extends AmqpMessage {
  job: string;
  releaseId: string;
  trackId: string;
  trackTitle: string;
  type: MessageType.Job;
  userId: string;
}

interface KeepAliveMessage extends AmqpMessage {
  type: MessageType.Ping | MessageType.Pong;
  userId: string;
  uuid: UUID;
}

interface MessageArtworkUploaded extends AmqpMessage {
  userId: string;
}

interface MessageEncodingError extends AmqpMessage {
  releaseId: string;
  stage: string;
  trackId: string;
  userId: string;
}

interface MessageEncodingProgress extends AmqpMessage {
  progress: number;
  trackId: string;
  userId: string;
}

interface MessageTrackStatus extends AmqpMessage {
  releaseId: string;
  status: string;
  trackId: string;
  userId: string;
}

interface MessageTranscoding extends AmqpMessage {
  trackId: string;
  trackTitle: string;
  userId: string;
}

interface MessageWorkerNotification extends AmqpMessage {
  message: string;
  title: string;
  type: MessageType.WorkerMessage;
  userId: string;
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

export {
  isBlockRangeMessage,
  isJobMessage,
  isJobOrBlockRangeMessage,
  isKeepAliveMessage,
  isServerSentMessage,
  MessageType
};
