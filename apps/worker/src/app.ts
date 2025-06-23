import "@gridfire/shared/models/Release";
import "@gridfire/shared/models/User";
import { amqpClose, amqpConnect } from "@gridfire/shared/amqp";
import Logger from "@gridfire/shared/logger";
import messageHandler from "@gridfire/worker/controllers/messageHandler";
import mongoose from "mongoose";
import assert from "node:assert/strict";
import net from "node:net";

const { MONGODB_URI = "" } = process.env;
const logger = new Logger("Worker");
let healthProbeServer: net.Server | null = null;

assert(MONGODB_URI, "MONGODB_URI env var missing.");

process
  .on("uncaughtException", error => logger.error("Uncaught exception:", error))
  .on("unhandledRejection", error => logger.error("Unhandled promise rejection:", error));

const handleShutdown = async () => {
  logger.info("Gracefully shutting down…");

  try {
    await new Promise(resolve => {
      if (healthProbeServer) {
        logger.info("Closing health probe server…");

        healthProbeServer.close(() => {
          logger.info("Health probe server closed.");
          resolve(void 0);
        });
      }
    });

    await amqpClose();
    mongoose.connection.close(false);
    logger.info("Mongoose closed.");
    process.exit(0);
  } catch (error) {
    logger.info(error);
    process.exitCode = 1;
  }
};

process.on("SIGINT", handleShutdown).on("SIGTERM", handleShutdown);

mongoose.set("strictQuery", true);
const db = mongoose.connection;
db.once("open", () => logger.info("Mongoose connected."));
db.on("close", () => logger.info("Mongoose connection closed."));
db.on("disconnected", () => logger.warn("Mongoose disconnected."));
db.on("reconnected", () => logger.info("Mongoose reconnected."));
db.on("error", error => logger.error("Mongoose error:", error));

const setupHealthProbe = () =>
  new Promise(resolve => {
    healthProbeServer = net.createServer();
    healthProbeServer.on("error", error => logger.error("Health probe server error:", error));

    healthProbeServer.listen(9090, () => {
      logger.info("Health probe server listening on port 9090.");
      resolve(void 0);
    });
  });

try {
  await mongoose.connect(MONGODB_URI);
  await amqpConnect({ messageHandler });
  await setupHealthProbe();
} catch (error: any) {
  logger.error(`Startup error: ${error.message}`);
}
