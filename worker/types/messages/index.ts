type ServerSentMessage = MessageEncodingError | MessageTranscoding | MessageTrackStatus | MessageEncodingProgress;

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

interface Message {
  type: string;
  userId: string;
}

export { MessageEncodingError, MessageEncodingProgress, MessageTrackStatus, MessageTranscoding, ServerSentMessage };
