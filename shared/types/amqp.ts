interface ConnectOptions {
  messageHandler?: MessageHandler;
}

type ConnectFunction = (options?: ConnectOptions) => Promise<void>;
type MessageHandler = (message: any) => Promise<void>;

export { ConnectOptions, ConnectFunction, MessageHandler };
