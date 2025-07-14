import { BlockRangeMessage, JobMessage } from "@gridfire/shared/types/messages";

type ConnectFunction = (options?: ConnectOptions) => Promise<void>;
interface ConnectOptions {
  messageHandler?: MessageHandler;
}

type MessageHandler = (message: BlockRangeMessage | JobMessage) => Promise<void>;

export type { ConnectFunction, ConnectOptions, MessageHandler };
