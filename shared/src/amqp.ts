import type { AmqpConnectionManager, ChannelWrapper as OriginalChannelWrapper } from "amqp-connection-manager";
import type { ConfirmChannel, ConsumeMessage } from "amqplib";

import Logger from "@gridfire/shared/logger";
import sseClient from "@gridfire/shared/sseController";
import {
  BlockRangeMessage,
  ConnectFunction,
  GlobalServerSentMessage,
  isGlobalServerSentMessage,
  isJobOrBlockRangeMessage,
  isKeepAliveMessage,
  isServerSentMessage,
  JobMessage,
  KeepAliveMessage,
  Notification,
  UserServerSentMessage
} from "@gridfire/shared/types";
import { connect } from "amqp-connection-manager";
import assert from "node:assert/strict";

interface ChannelWrapper extends OriginalChannelWrapper {
  context?: { messageHandler?: (message: BlockRangeMessage | JobMessage) => Promise<void> };
}

const { INPUT_QUEUES, RABBITMQ_DEFAULT_PASS, RABBITMQ_DEFAULT_USER, RABBITMQ_HOST } = process.env;
let connection: AmqpConnectionManager;
let consumeChannel: ChannelWrapper;
const consumerTags: string[] = [];
let isShuttingDown = false;
const logger = new Logger("amqp.ts");
let publishChannel: ChannelWrapper;

assert(RABBITMQ_DEFAULT_USER, "RABBITMQ_DEFAULT_USER env var missing.");
assert(RABBITMQ_DEFAULT_PASS, "RABBITMQ_DEFAULT_PASS env var missing.");
assert(RABBITMQ_HOST, "RABBITMQ_HOST env var missing.");

const onMessage = async (data: ConsumeMessage | null) => {
  if (data === null) return; // null message fired if consumer was cancelled.

  if (!consumeChannel) {
    logger.error("Consume channel not initialised.");
    return;
  }

  const { context } = consumeChannel;
  const { messageHandler } = context || {};

  try {
    const message = JSON.parse(data.content.toString());

    if (isKeepAliveMessage(message)) {
      const { userId, uuid } = message;
      sseClient.ping(userId, uuid);
      return void consumeChannel.ack(data);
    }

    if (isGlobalServerSentMessage(message)) {
      sseClient.sendToAll(message);
      return void consumeChannel.ack(data);
    }

    if (isServerSentMessage(message)) {
      const { userId, ...rest } = message;
      sseClient.send(userId, rest);
      return void consumeChannel.ack(data);
    }

    if (isJobOrBlockRangeMessage(message) && messageHandler) {
      await messageHandler(message);
      return void consumeChannel.ack(data);
    }

    logger.error("Received unknown message type:", message);
    consumeChannel.ack(data);
  } catch (error: unknown) {
    if (error instanceof Error) {
      logger.error("Error processing message:", error.message ?? error);
      consumeChannel.nack(data, false, false);
    }
  }
};

const amqpClose = async () => {
  if (!connection) return;

  if (isShuttingDown) {
    logger.info("Connection is already shutting down.");
    return;
  }

  logger.info("Closing connection…");
  isShuttingDown = true;

  for (const tag of consumerTags) {
    if (!consumeChannel) break;
    await consumeChannel.cancel(tag);
    logger.info(`Consumer '${tag}' cancelled.`);
  }

  await connection.close();
  logger.info("Connection closed.");
};

const amqpConnect: ConnectFunction = async ({ messageHandler } = {}) => {
  try {
    const url = `amqp://${RABBITMQ_DEFAULT_USER}:${RABBITMQ_DEFAULT_PASS}@${RABBITMQ_HOST}:5672`;
    connection = connect(url);
    connection.on("blocked", error => logger.error("Connection blocked:", error));
    connection.on("connect", () => logger.info("Connected."));
    connection.on("connectFailed", error => logger.error("Connection failed:", error));
    connection.on("disconnect", error => logger.error("Connection disconnected:", error));
    connection.on("unblocked ", error => logger.info("Connection unblocked:", error));

    publishChannel = connection.createChannel({
      json: true,
      name: "publisher",
      setup: async (channel: ConfirmChannel) => {
        await channel.assertExchange("user", "direct");
      }
    });

    publishChannel.on("close", () => logger.warn("Publish channel closed."));
    publishChannel.on("connect", () => logger.info("Publish channel connected."));
    publishChannel.on("error", error => logger.error("Publish channel error:", error));

    consumeChannel = connection.createChannel({
      json: true,
      name: "consumer",
      setup: async (channel: ConfirmChannel) => {
        if (INPUT_QUEUES) {
          for (let queueName of INPUT_QUEUES.split(",")) {
            queueName = queueName.trim();
            assert(queueName, "QUEUE_NAMES env var is not set correctly.");
            await channel.assertQueue(queueName, { durable: true });
            const config = await channel.consume(queueName, onMessage);
            const { consumerTag } = config || {};
            consumerTags.push(consumerTag);
          }
        }
      }
    });

    consumeChannel.on("close", () => logger.warn("Consume channel closed."));
    consumeChannel.on("connect", () => logger.info("Consume channel connected."));
    consumeChannel.on("error", error => logger.error("Consume channel error:", error));
    consumeChannel.context = { messageHandler };
    sseClient.setConsumerChannel(consumeChannel, onMessage);
  } catch (error: unknown) {
    if (error instanceof Error) {
      logger.error(`Connection error: ${error.message}`);
    }
  }
};

const publishToQueue = async (
  exchange: string,
  routingKey: string,
  message:
    | BlockRangeMessage
    | GlobalServerSentMessage
    | JobMessage
    | KeepAliveMessage
    | Notification
    | UserServerSentMessage
): Promise<void> => {
  await publishChannel.publish(exchange, routingKey, message, { persistent: true });
};

export { amqpClose, amqpConnect, publishToQueue };
