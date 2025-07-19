import type { ServerSentMessagePayload } from "@gridfire/shared/types";
import type { ChannelWrapper } from "amqp-connection-manager";
import type { ConsumeMessage } from "amqplib";
import type { Response } from "express";
import type { ObjectId } from "mongoose";
import type { UUID } from "node:crypto";

import Logger from "@gridfire/shared/logger";
import { MessageType } from "@gridfire/shared/types";
import os from "node:os";

type MessageHandler = (data: ConsumeMessage) => Promise<void>;
type Session = Map<SocketId, Connection>;
type SocketId = UUID;
type UserId = string;

const CHECK_INTERVAL = 1000 * 60 * 2;
const { POD_NAME = os.hostname().toLowerCase() } = process.env;
const logger = new Logger("SSE");

interface Connection {
  lastPing: number;
  res: Response;
}

class SSEClient {
  #consumerChannel: ChannelWrapper | null = null;
  #consumerTags: Map<string, string> = new Map();
  #houseKeepingActive = false;
  #interval: NodeJS.Timeout | null = null;
  #messageHandler: MessageHandler | null = null;
  #sessions: Map<UserId, Session> = new Map();

  constructor() {
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
        return connections.set(socketId, { lastPing: Date.now(), res });
      }
    }

    logger.info(`${context} Storing first connection…`);
    const connections = new Map();
    connections.set(socketId, { lastPing: Date.now(), res });
    this.#sessions.set(userId, connections);

    if (this.#consumerChannel) {
      const userQueue = `user.${userId}.${POD_NAME}`;
      const queueOptions = { autoDelete: true, durable: false };
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

  get(userId: ObjectId | UserId): Session | undefined {
    return this.#sessions.get(userId.toString());
  }

  ping(userId: UserId, socketId: SocketId) {
    const connections = this.get(userId);

    if (!connections) {
      logger.info(`No connections found for ${userId}. Removing user from sessions…`);
      this.#sessions.delete(userId);
      return;
    }

    const connection = connections.get(socketId);

    if (!connection) {
      logger.info(`Connection ID ${socketId} not found for user ${userId}.`);
      return;
    }

    const { res } = connection;
    connections.set(socketId, { lastPing: Date.now(), res });
    res.write("event: pong\n");
    res.write("data: \n\n");
    return;
  }

  removeConnection(userId: UserId, socketId: SocketId) {
    const connections = this.get(userId);

    if (!connections) {
      logger.info(`[removeConnection] No connections found for user ${userId}.`);
      return;
    }

    if (connections.has(socketId)) {
      logger.info(`[removeConnection] Removing connection ${socketId} for user ${userId}.`);
      connections.delete(socketId);
    } else {
      logger.info(`[removeConnection] Connection ID ${socketId} not found for user ${userId}.`);
    }

    if (connections.size === 0) {
      this.#remove(userId);
    }
  }

  send(userId: UserId, message: ServerSentMessagePayload): void {
    const connections = this.get(userId.toString());

    if (!connections) {
      return void logger.warn(`[send] No connections found for user ${userId}.`);
    }

    for (const [socketId, { res }] of connections.entries()) {
      const data = JSON.stringify(message);
      logger.info(`[send] Sending message for user ${userId} via socket ${socketId}: ${data}`);

      try {
        if (message.type === MessageType.WorkerMessage) {
          res.write("event: workerMessage\n");
          res.write(`data: ${data}\n\n`);
        } else {
          res.write(`event: ${message.type}\n`);
          res.write(`data: ${data}\n\n`);
        }
      } catch (error: unknown) {
        if (error instanceof Error) {
          logger.error(`[send] Error sending message to user ${userId} via socket ${socketId}: ${error.message}`);
          connections.delete(socketId);
        }
      }
    }
  }

  sendToAll(message: ServerSentMessagePayload): void {
    if (this.#sessions.size === 0) return;
    logger.info(`[sendToAll] Sending message to all users: ${JSON.stringify(message)}`);
    for (const [, connections] of this.#sessions.entries()) {
      for (const [, { res }] of connections.entries()) {
        const data = JSON.stringify(message);
        res.write(`event: ${message.type}\n`);
        res.write(`data: ${data}\n\n`);
      }
    }
  }

  setConsumerChannel(channel: ChannelWrapper, messageHandler: MessageHandler) {
    this.#consumerChannel = channel;
    this.#messageHandler = messageHandler;
  }

  #has(userId: UserId) {
    return this.#sessions.has(userId);
  }

  async #remove(userId: UserId) {
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

      if (this.#houseKeepingActive) {
        return void logger.debug("[housekeeping] Already active. Skipping this check.");
      }

      logger.info("[housekeeping] Checking for stale sockets…");
      this.#houseKeepingActive = true;

      try {
        for (const [userId, connections] of this.#sessions.entries()) {
          logger.debug(`User ${userId} has ${connections.size} connections.`);

          for (const [socketId, { lastPing, res }] of connections.entries()) {
            if (Date.now() - lastPing > CHECK_INTERVAL) {
              logger.info(`Removing stale connection ${socketId} for user ${userId}.`);
              if (res) res.end();
              connections.delete(socketId);
            }
          }

          if (connections.size === 0) {
            this.#remove(userId);
          }
        }

        logger.info("[housekeeping] Checks complete.");
      } catch (error: unknown) {
        logger.error("[housekeeping] Error:", error);
      } finally {
        this.#houseKeepingActive = false;
      }
    };

    this.#interval = setInterval(checkUserConnections, CHECK_INTERVAL);
  }
}

const sseClient = new SSEClient();

export type { SSEClient };
export default sseClient;
