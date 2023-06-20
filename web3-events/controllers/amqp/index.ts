import { ErrorCodes, MessageTuple, Notification } from "gridfire-web3-events/types/index.js";
import amqp, { ConfirmChannel, Connection } from "amqplib";
import { strict as assert } from "assert/strict";
import closeOnError from "gridfire-web3-events/controllers/amqp/closeOnError.js";
import logger from "gridfire-web3-events/controllers/logger.js";
import reconnect from "gridfire-web3-events/controllers/amqp/reconnect.js";

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
let channel: ConfirmChannel | null = null;
let connection: Connection | null = null;

const offlineQueue: MessageTuple[] = [];

assert(RABBITMQ_DEFAULT_PASS, "Rabbitmq password env var missing.");
assert(RABBITMQ_DEFAULT_USER, "Rabbitmq username env var missing.");
assert(RABBITMQ_HOST, "Rabbitmq host env var missing.");

const amqpClose = async () => {
  if (!connection) return;
  await connection.close.bind(connection);
  logger.info("AMQP closed.");
};

const publishToQueue = (exchange: string, routingKey: string, message: Notification) => {
  const data = Buffer.from(JSON.stringify(message));

  try {
    channel?.publish(exchange, routingKey, data, { persistent: true });
  } catch (error) {
    logger.error(error);
    offlineQueue.push([exchange, routingKey, data]);
    if (channel) channel.connection.close();
  }
};

const startPublisher = async () => {
  try {
    channel = (await connection?.createConfirmChannel()) || null;
    channel?.on("error", error => logger.error(`AMQP Channel error: ${error.message}`));

    while (offlineQueue.length) {
      const job = offlineQueue.shift();
      if (!job) break;
      const [exchange, routingKey, data] = job;
      publishToQueue(exchange, routingKey, JSON.parse(data.toString()));
    }
  } catch (error) {
    logger.error(error);
    if (connection && closeOnError(connection, error)) return;
  }
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

    startPublisher();
  } catch (error: any) {
    if (error.code === "ECONNREFUSED") {
      logger.error(`AMQP connection error! ${error.code}: ${error.message}`);
    } else {
      logger.error(error);
    }

    reconnect(amqpConnect);
  }
};

export { amqpConnect, amqpClose, publishToQueue, startPublisher as default };
