import amqp, { Channel, Connection } from "amqplib";
import { ErrorCodes } from "gridfire-worker/types/index.js";
import logger from "gridfire-worker/controllers/logger.js";
import reconnect from "gridfire-worker/controllers/amqp/reconnect.js";
import startConsumer from "gridfire-worker/consumer/index.js";
import startPublisher from "gridfire-worker/publisher/index.js";
import assert from "assert/strict";

const isFatalError = (error: any) => {
  switch (error && error.code) {
    case ErrorCodes.CONNECTION_FORCED:
    case ErrorCodes.REPLY_SUCCESS:
      return false;
    default:
      return true;
  }
};

const { RABBITMQ_DEFAULT_PASS, RABBITMQ_DEFAULT_USER, RABBITMQ_HOST } = process.env;
let connection: Connection | null = null;
let consumerChannel: Channel | null = null;
let consumerTags: string[] = [];

assert(RABBITMQ_DEFAULT_PASS, "RABBITMQ_DEFAULT_PASS env var missing.");
assert(RABBITMQ_DEFAULT_USER, "RABBITMQ_DEFAULT_USER env var missing.");
assert(RABBITMQ_HOST, "RABBITMQ_HOST env var missing.");

const amqpClose = async () => {
  if (!connection) return;

  for (const tag of consumerTags) {
    if (!consumerChannel) break;
    await consumerChannel.cancel(tag);
    logger.info(`AMQP consumer '${tag}' cancelled.`);
  }

  await connection.close.bind(connection);
  logger.info("AMQP closed.");
};

const amqpConnect = async () => {
  try {
    const url = `amqp://${RABBITMQ_DEFAULT_USER}:${RABBITMQ_DEFAULT_PASS}@${RABBITMQ_HOST}:5672`;
    connection = await amqp.connect(url);
    logger.info("AMQP connected.");
    connection.on("error", error => logger.error(`AMQP error: ${error.message}`));

    connection.on("close", error => {
      if (isFatalError(error)) {
        return logger.error("AMQP connection closed.");
      }

      logger.error("AMQP connection closed. Reconnecting…");
      reconnect(amqpConnect);
    });

    startPublisher(connection);
    consumerChannel = await startConsumer(connection, consumerTags);
  } catch (error: any) {
    if (error.code === "ECONNREFUSED") {
      logger.error(`AMQP connection error! ${error.code}: ${error.message}`);
    } else {
      logger.error(error);
    }

    reconnect(amqpConnect);
  }
};

export { amqpConnect, amqpClose };
