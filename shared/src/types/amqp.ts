interface BlockMessage {
  fromBlock: string;
  toBlock: string;
}

type ConnectFunction = (options?: ConnectOptions) => Promise<void>;
interface ConnectOptions {
  messageHandler?: MessageHandler;
}

interface JobMessage {
  job: string;
  releaseId: string;
  trackId: string;
  trackTitle: string;
  userId: string;
}

type MessageHandler = (message: BlockMessage | JobMessage) => Promise<void>;

export type { BlockMessage, ConnectFunction, ConnectOptions, JobMessage, MessageHandler };
