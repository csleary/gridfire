import amqp from "amqplib";
import startConsumer from "./consumer.js";
import startPublisher from "./publisher.js";
import amqpConnection from "amqplib/lib/connection.js";

const { RABBITMQ_DEFAULT_USER, RABBITMQ_DEFAULT_PASS, RABBIT_HOST } = process.env;

const connect = async sse => {
  try {
    const url = `amqp://${RABBITMQ_DEFAULT_USER}:${RABBITMQ_DEFAULT_PASS}@${RABBIT_HOST}:5672`;
    const connection = await amqp.connect(url);
    console.log("[AMQP] Connected.");
    connection.on("error", error => console.error(`[AMQP] error: ${error.message}`));

    connection.on("close", error => {
      if (amqpConnection.isFatalError(error)) return console.log("[AMQP] Connection closed.");
      console.error("[AMQP] Connection closed. Reconnecting…");
      return setTimeout(connect, 3000);
    });

    process.once("SIGINT", connection.close.bind(connection));
    startPublisher(connection);
    startConsumer(connection, sse);
  } catch (error) {
    console.error(error);
    setTimeout(connect, 3000);
  }
};

export default connect;
