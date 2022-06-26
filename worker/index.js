import amqp from "amqplib";
import mongoose from "mongoose";
import net from "net";
import startConsumer from "gridfire-worker/consumer/index.js";
import startPublisher from "gridfire-worker/publisher/index.js";
import "gridfire-worker/models/Release.js";
import "gridfire-worker/models/User.js";

const { MONGODB_URI, RABBITMQ_DEFAULT_PASS, RABBITMQ_DEFAULT_USER, RABBITMQ_HOST } = process.env;
let amqpConnection;

process
  .on("uncaughtException", error => console.error("[Worker] Unhandled exception:", error))
  .on("unhandledRejection", error => console.error("[Worker] Unhandled promise rejection:", error));

const db = mongoose.connection;
db.once("open", async () => console.log("[Worker][Mongoose] Connected."));
db.on("close", () => console.log("[Worker][Mongoose] Connection closed."));
db.on("disconnected", () => console.log("[Worker][Mongoose] Disconnected."));
db.on("error", console.error);

await new Promise(resolve => {
  const healthProbeServer = net.createServer(socket => {
    // console.log("[Worker] Health probe connected.");
    // socket.on("end", () => console.log("[Worker] Health probe disconnected."));
  });

  healthProbeServer.on("error", error => console.error(`[Worker] Health probe server error: ${error}`));

  healthProbeServer.listen(9090, () => {
    console.log("[Worker] Health probe server listening on port 9090.");
    resolve();
  });
});

const amqpConnect = async () => {
  try {
    const url = `amqp://${RABBITMQ_DEFAULT_USER}:${RABBITMQ_DEFAULT_PASS}@${RABBITMQ_HOST}:5672`;
    const connection = await amqp.connect(url);
    console.log("[Worker][AMQP] Connected.");
    connection.on("error", error => console.error(`[Worker][AMQP] error: ${error.message}`));

    connection.on("close", error => {
      if (amqpConnection.isFatalError(error)) {
        return console.log("[Worker][AMQP] Connection closed.");
      }

      console.error("[Worker][AMQP] Connection closed. Reconnecting…");
      return setTimeout(amqpConnect, 3000);
    });

    startPublisher(connection);
    startConsumer(connection);
    return connection;
  } catch (error) {
    setTimeout(amqpConnect, 3000);
  }
};

try {
  await mongoose.connect(MONGODB_URI);
  amqpConnection = await amqpConnect();
} catch (error) {
  console.error(`[Worker] Node execution error: ${error.message}`);
}

const handleShutdown = async () => {
  try {
    console.log("[Worker] Gracefully shutting down…");

    if (amqpConnection) {
      await amqpConnection.close.bind(amqpConnection);
      console.log("[Worker][AMQP] Closed.");
    }

    mongoose.connection.close(false, () => {
      console.log("[Worker][Mongoose] Closed.");
      process.exit(0);
    });
  } catch (error) {
    console.log(error);
    process.exit(0);
  }
};

process.on("SIGINT", handleShutdown).on("SIGTERM", handleShutdown);