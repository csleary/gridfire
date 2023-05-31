import "gridfire-worker/models/Release.js";
import "gridfire-worker/models/User.js";
import amqp from "amqplib";
import { isFatalError } from "amqplib/lib/connection.js";
import mongoose from "mongoose";
import net from "net";
import startConsumer from "gridfire-worker/consumer/index.js";
import startPublisher from "gridfire-worker/publisher/index.js";

const { MONGODB_URI, RABBITMQ_DEFAULT_PASS, RABBITMQ_DEFAULT_USER, RABBITMQ_HOST } = process.env;
let amqpConnection;
let consumerChannel;
let consumerTags = [];

process
  .on("uncaughtException", error => console.error("[Worker] Uncaught exception:", error))
  .on("unhandledRejection", error => console.error("[Worker] Unhandled promise rejection:", error));

mongoose.set("strictQuery", true);
const db = mongoose.connection;
db.once("open", async () => console.log("[Worker] Mongoose connected."));
db.on("close", () => console.log("[Worker] Mongoose connection closed."));
db.on("disconnected", () => console.warn("[Worker] Mongoose disconnected."));
db.on("reconnected", () => console.info("[Worker] Mongoose reconnected."));
db.on("error", console.error);

const amqpConnect = async () => {
  try {
    const url = `amqp://${RABBITMQ_DEFAULT_USER}:${RABBITMQ_DEFAULT_PASS}@${RABBITMQ_HOST}:5672`;
    const connection = await amqp.connect(url);
    console.log("[Worker] AMQP connected.");
    connection.on("error", error => console.error(`[Worker] AMQP error: ${error.message}`));

    connection.on("close", error => {
      if (isFatalError(error)) {
        return console.log("[Worker] AMQP connection closed.");
      }

      console.error("[Worker] AMQP connection closed. Reconnecting…");
      return setTimeout(amqpConnect, 3000);
    });

    startPublisher(connection);
    const channel = await startConsumer(connection, consumerTags);
    return [connection, channel];
  } catch (error) {
    setTimeout(amqpConnect, 3000);
  }
};

const setupHealthProbe = () =>
  new Promise(resolve => {
    const healthProbeServer = net.createServer();
    healthProbeServer.on("error", console.error.bind(null, "[Worker] Health probe server error:"));

    healthProbeServer.listen(9090, () => {
      console.log("[Worker] Health probe server listening on port 9090.");
      resolve();
    });
  });

try {
  await mongoose.connect(MONGODB_URI);
  [amqpConnection, consumerChannel] = await amqpConnect();
  await setupHealthProbe();
} catch (error) {
  console.error(`[Worker] Startup error: ${error.message}`);
}

const handleShutdown = async () => {
  console.log("[Worker] Gracefully shutting down…");

  try {
    if (amqpConnection) {
      for (const tag of consumerTags) {
        await consumerChannel.cancel(tag);
      }

      await amqpConnection.close.bind(amqpConnection);
      console.log("[Worker] AMQP closed.");
    }

    mongoose.connection.close(false, () => {
      console.log("[Worker] Mongoose closed.");
      process.exit(0);
    });
  } catch (error) {
    console.log(error);
    process.exitCode = 1;
  }
};

process.on("SIGINT", handleShutdown).on("SIGTERM", handleShutdown);
