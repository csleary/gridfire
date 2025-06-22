import Logger from "@gridfire/shared/logger";
import { Channel, ChannelModel, connect } from "amqplib";
import assert from "node:assert/strict";
import startConsumer from "./consumer.js";
import startPublisher from "./publisher.js";
import reconnect from "./reconnect.js";
import { ConnectFunction, MessageHandler } from "@gridfire/shared/types/amqp.js";

const logger = new Logger("AMQP");
const { RABBITMQ_DEFAULT_USER, RABBITMQ_DEFAULT_PASS, RABBITMQ_HOST } = process.env;
let connection: ChannelModel;
let consumerChannel: Channel | undefined;
let consumerTags: string[] = [];
let isShuttingDown = false;

assert(RABBITMQ_DEFAULT_USER, "RABBITMQ_DEFAULT_USER env var missing.");
assert(RABBITMQ_DEFAULT_PASS, "RABBITMQ_DEFAULT_PASS env var missing.");
assert(RABBITMQ_HOST, "RABBITMQ_HOST env var missing.");

const amqpClose = async () => {
  if (!connection) return;

  if (isShuttingDown) {
    logger.info("Connection is already shutting down.");
    return;
  }

  logger.info("Closing connection…");
  isShuttingDown = true;

  for (const tag of consumerTags) {
    if (!consumerChannel) break;
    await consumerChannel.cancel(tag);
    logger.info(`Consumer '${tag}' cancelled.`);
  }

  await connection.close();
  logger.info("Connection closed.");
};

const amqpConnect: ConnectFunction = async ({ messageHandler } = {}) => {
  try {
    const url = `amqp://${RABBITMQ_DEFAULT_USER}:${RABBITMQ_DEFAULT_PASS}@${RABBITMQ_HOST}:5672`;
    connection = await connect(url);
    logger.info("Connected.");
    connection.on("error", error => logger.error(`Connection error: ${error.message}`));

    connection.on("close", () => {
      if (isShuttingDown) return;
      logger.error("Connection closed. Reconnecting…");
      return reconnect(amqpConnect, messageHandler);
    });

    await startPublisher(connection);
    consumerChannel = await startConsumer(connection, consumerTags, messageHandler);
  } catch (error: any) {
    if (error.code === "ECONNREFUSED") {
      logger.error(`Connection error: ${error.message}`);
    } else {
      logger.error(error);
    }

    return reconnect(amqpConnect, messageHandler);
  }
};

export { amqpClose, amqpConnect };
