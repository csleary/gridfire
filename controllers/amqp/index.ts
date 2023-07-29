import { Connection, Channel, connect } from "amqplib";
import { ErrorCodes } from "gridfire/types/index.js";
import assert from "assert/strict";
import logger from "gridfire/controllers/logger.js";
import reconnect from "./reconnect.js";
import startConsumer from "./consumer.js";
import startPublisher from "./publisher.js";

const isFatalError = (error: any) => {
  switch (error && error.code) {
    case ErrorCodes.CONNECTION_FORCED:
    case ErrorCodes.REPLY_SUCCESS:
      return false;
    default:
      return true;
  }
};

const { RABBITMQ_DEFAULT_USER, RABBITMQ_DEFAULT_PASS, RABBITMQ_HOST } = process.env;
let connection: Connection;
let consumerChannel: Channel | null = null;
let consumerTags: string[] = [];

assert(RABBITMQ_DEFAULT_USER, "RABBITMQ_DEFAULT_USER env var missing.");
assert(RABBITMQ_DEFAULT_PASS, "RABBITMQ_DEFAULT_PASS env var missing.");
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
    connection = await connect(url);
    logger.info("AMQP connected.");
    connection.on("error", error => logger.error(`AMQP error: ${error.message}`));

    connection.on("close", error => {
      if (isFatalError(error)) return logger.error("AMQP connection has closed due to a permanent error.");
      logger.error("AMQP connection closed. Reconnecting…");
      return reconnect(amqpConnect);
    });

    startPublisher(connection);

    consumerChannel = (await startConsumer(connection, consumerTags)) || null;
  } catch (error: any) {
    if (error.code === "ECONNREFUSED") {
      logger.error(`AMQP connection error! ${error.code}: ${error.message}`);
    } else {
      logger.error(error);
    }

    return reconnect(amqpConnect);
  }
};

export { amqpConnect, amqpClose };
