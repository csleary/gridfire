import mongoose from "mongoose";
import amqp from "amqplib";
import startConsumer from "./consumer/index.js";
import startPublisher from "./publisher/index.js";
import "./models/Release.js";

const { MONGO_URI, RABBITMQ_USER, RABBIT_HOST, RABBITMQ_PASS } = process.env;

const db = mongoose.connection;
db.once("open", async () => console.log("[Worker] [Mongoose] Connected."));
db.on("close", () => console.log("[Worker] [Mongoose] Connection closed."));
db.on("disconnected", () => console.log("[Worker] [Mongoose] Disconnected."));
db.on("error", console.log);

const amqpConnect = async () => {
  try {
    const url = `amqp://${RABBITMQ_USER}:${RABBITMQ_PASS}@${RABBIT_HOST}:5672`;
    const connection = await amqp.connect(url);
    console.log("[Worker] [AMQP] Connected.");
    connection.on("error", error => console.error(`[Worker] [AMQP] error: ${error.message}`));

    connection.on("close", error => {
      if (amqpConnection.isFatalError(error)) return console.log("[AMQP] Connection closed.");
      console.error("[Worker] [AMQP] Connection closed. Reconnecting…");
      return setTimeout(amqpConnect, 3000);
    });

    startPublisher(connection);
    startConsumer(connection);
    return connection;
  } catch (error) {
    setTimeout(amqpConnect, 3000);
  }
};

await mongoose.connect(MONGO_URI).catch(console.error);
const amqpConnection = await amqpConnect().catch(console.error);

const handleShutdown = async () => {
  console.log("[Worker] Gracefully shutting down…");
  await amqpConnection.close.bind(amqpConnection);
  console.log("[Worker] [AMQP] Closed.");
  mongoose.connection.close(false, () => {
    console.log("[Worker] [Mongoose] Closed.");
    process.exit(0);
  });
};

process
  .on("SIGINT", handleShutdown)
  .on("SIGTERM", handleShutdown)
  .on("uncaughtException", error => console.log("[Worker] Unhandled exception:", error))
  .on("unhandledRejection", error => console.log("[Worker] Unhandled promise rejection:", error));
