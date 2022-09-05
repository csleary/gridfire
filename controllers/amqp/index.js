import amqp from "amqplib";
import { isFatalError } from "amqplib/lib/connection.js";
import startConsumer from "./consumer.js";
import startPublisher from "./publisher.js";

const { RABBITMQ_DEFAULT_USER, RABBITMQ_DEFAULT_PASS, RABBITMQ_HOST } = process.env;

const connect = async sse => {
  try {
    const url = `amqp://${RABBITMQ_DEFAULT_USER}:${RABBITMQ_DEFAULT_PASS}@${RABBITMQ_HOST}:5672`;
    const connection = await amqp.connect(url);
    console.log("[API] AMQP connected.");
    connection.on("error", error => console.error(`[API] AMQP error: ${error.message}`));

    connection.on("close", error => {
      if (isFatalError(error)) return console.log("[API] AMQP connection closed.");
      console.error("[API] AMQP connection closed. Reconnecting…");
      return setTimeout(connect, 3000);
    });

    startPublisher(connection);
    const { channel, consumerTag } = await startConsumer(connection, sse);
    return [connection, channel, consumerTag];
  } catch (error) {
    console.error(error);
    setTimeout(connect, 3000);
  }
};

export default connect;
