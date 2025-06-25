import Logger from "@gridfire/shared/logger";
import type { ServerSentMessage } from "@gridfire/shared/types/messages";
import { MessageType } from "@gridfire/shared/types/messages";
import type { ChannelWrapper } from "amqp-connection-manager";
import type { ConsumeMessage } from "amqplib";
import type { Response } from "express";
import type { ObjectId } from "mongoose";
import type { UUID } from "node:crypto";

type SocketId = UUID;
type MessageHandler = (data: ConsumeMessage | null) => Promise<undefined>;
type Session = Map<SocketId, Connection>;
type UserId = string;

const CHECK_INTERVAL = 1000 * 60 * 2;
const { POD_NAME = "dev" } = process.env;
const logger = new Logger("SSE");

interface Connection {
  res: Response;
  lastPing: number;
}

class SSEClient {
  #consumerChannel: ChannelWrapper | null;
  #consumerTags: Map<string, string>;
  #messageHandler: MessageHandler | null;
  #interval: NodeJS.Timeout | null;
  #sessions: Map<UserId, Session>;

  constructor() {
    this.#consumerChannel = null;
    this.#consumerTags = new Map();
    this.#interval = null;
    this.#messageHandler = null;
    this.#sessions = new Map();
    this.#runHouseKeeping();
  }

  async add(res: Response, userId: UserId, socketId: SocketId) {
    const context = `[user ${userId}]::[${POD_NAME}]::[socket ${socketId}]`;

    if (this.#has(userId)) {
      const connections = this.get(userId);

      if (connections && connections.has(socketId)) {
        logger.info(`${context} Closing existing connection…`);
        const connection = connections.get(socketId) as Connection;
        connection.res.end();
      }

      if (connections) {
        logger.info(`${context} Storing connection…`);
        return connections.set(socketId, { res, lastPing: Date.now() });
      }
    }

    logger.info(`${context} Storing first connection…`);
    const connections = new Map();
    connections.set(socketId, { res, lastPing: Date.now() });
    this.#sessions.set(userId, connections);
    const userQueue = `user.${userId}.${POD_NAME}`;
    const queueOptions = { autoDelete: true, durable: false };

    if (this.#consumerChannel) {
      await this.#consumerChannel.assertQueue(userQueue, queueOptions);
      await this.#consumerChannel.bindQueue(userQueue, "user", userId);

      if (this.#messageHandler) {
        const { consumerTag } = await this.#consumerChannel.consume(userQueue, this.#messageHandler, { noAck: false });
        this.#consumerTags.set(userId, consumerTag);
      } else {
        logger.warn(`${context} Message handler not set.`);
      }
    } else {
      logger.warn(`${context} Consumer channel not set.`);
    }
  }

  get(userId: UserId | ObjectId) {
    return this.#sessions.get(userId.toString());
  }

  #has(userId: UserId) {
    return this.#sessions.has(userId);
  }

  ping(userId: UserId, socketId: SocketId) {
    const connections = this.get(userId);

    if (!connections) {
      logger.info(`No connection found for ${userId}. Removing user from sessions…`);
      this.#sessions.delete(userId);
      return;
    }

    const { res } = connections.get(socketId) as Connection;
    connections.set(socketId, { res, lastPing: Date.now() });
    const connection = connections.get(socketId);

    if (connection) {
      connection.res.write("event: pong\n");
      connection.res.write("data: \n\n");
      return;
    }

    logger.info(`Connection ${socketId} for user ${userId} not present on this pod.`);
  }

  async remove(userId: UserId) {
    logger.info(`Removing connection for user ${userId}…`);
    this.#sessions.delete(userId);

    if (!this.#consumerChannel) {
      logger.warn("Consumer channel not set.");
      return;
    }

    const consumerTag = this.#consumerTags.get(userId);

    if (consumerTag) {
      await this.#consumerChannel.cancel(consumerTag);
    } else {
      logger.warn(`Consumer tag not found for user ${userId}.`);
    }
  }

  #runHouseKeeping() {
    if (this.#interval) {
      clearInterval(this.#interval);
    }

    const checkUserConnections = () => {
      if (this.#sessions.size === 0) return;
      logger.info("Checking for stale sockets…");
      const iterator = this.#sessions.entries();

      const checkForStaleConnection = ({ value, done }: IteratorResult<[UserId, Session]>) => {
        if (done) return;
        const [userId, connections] = value;
        logger.debug(`User ${userId} has ${connections.size} connections.`);

        for (const [socketId, { lastPing, res }] of connections.entries()) {
          if (Date.now() - lastPing > CHECK_INTERVAL) {
            logger.info(`Removing stale connection ${socketId} for user ${userId}.`);
            if (res) res.end();
            connections.delete(socketId);
          }
        }

        if (connections.size === 0) this.remove(userId);
        setTimeout(checkForStaleConnection, 0, iterator.next());
      };

      checkForStaleConnection(iterator.next());
    };

    this.#interval = setInterval(checkUserConnections, CHECK_INTERVAL);
  }

  send(userId: UserId, message: ServerSentMessage) {
    const connections = this.get(userId.toString());
    if (!connections) return;

    for (const [socketId, { res }] of connections.entries()) {
      const logEntry = JSON.stringify(message);
      logger.info(`Sending message for user ${userId} via socket ${socketId}: ${logEntry}`);
      const data = JSON.stringify(message);

      if (message.type === MessageType.WorkerMessage) {
        res.write("event: workerMessage\n");
        res.write(`data: ${data}\n\n`);
      } else {
        res.write(`event: ${message.type}\n`);
        res.write(`data: ${data}\n\n`);
      }
    }
  }

  setConsumerChannel(channel: ChannelWrapper, messageHandler: MessageHandler) {
    this.#consumerChannel = channel;
    this.#messageHandler = messageHandler;
  }
}

const sseClient = new SSEClient();

export { SSEClient };

export default sseClient;
