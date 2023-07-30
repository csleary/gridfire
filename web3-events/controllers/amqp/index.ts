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
let channel: ConfirmChannel;
let connection: Connection;
const offlineQueue: MessageTuple[] = [];

assert(RABBITMQ_DEFAULT_PASS, "RABBITMQ_DEFAULT_PASS env var missing.");
assert(RABBITMQ_DEFAULT_USER, "RABBITMQ_DEFAULT_USER env var missing.");
assert(RABBITMQ_HOST, "RABBITMQ_HOST env var missing.");

const amqpClose = async () => {
  if (!connection) return;
  await connection.close.bind(connection);
  logger.info("AMQP closed.");
};

const publishToQueue = async (exchange: string, routingKey: string, message: Notification) => {
  const data = Buffer.from(JSON.stringify(message));

  try {
    await new Promise((resolve, reject) => {
      if (!channel) {
        return reject(new Error("No AMQP publishing channel available."));
      }

      channel.publish(exchange, routingKey, data, { persistent: true }, error => {
        if (error) return reject(error);
        resolve(void 0);
      });
    });
  } catch (error) {
    logger.error(error);
    offlineQueue.push([exchange, routingKey, data]);
    if (channel) channel.connection.close();
  }
};

const startPublisher = async () => {
  try {
    if (!connection) {
      logger.warn("No AMQP connection available.");
      return;
    }

    channel = (await connection.createConfirmChannel()) as ConfirmChannel;
    channel.on("error", error => logger.error(`AMQP Channel error: ${error.message}`));

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
    connection = (await amqp.connect(url)) as Connection;
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
