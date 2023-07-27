import "gridfire-worker/models/Release.js";
import "gridfire-worker/models/User.js";
import { amqpClose, amqpConnect } from "gridfire-worker/controllers/amqp/index.js";
import logger from "gridfire-worker/controllers/logger.js";
import mongoose from "mongoose";
import net from "net";

const { MONGODB_URI = "" } = process.env;
let healthProbeServer: net.Server | null = null;

process
  .on("uncaughtException", error => logger.error("Uncaught exception:", error))
  .on("unhandledRejection", error => logger.error("Unhandled promise rejection:", error));

mongoose.set("strictQuery", true);
const db = mongoose.connection;
db.once("open", async () => logger.info("Mongoose connected."));
db.on("close", () => logger.info("Mongoose connection closed."));
db.on("disconnected", () => logger.warn("Mongoose disconnected."));
db.on("reconnected", () => logger.info("Mongoose reconnected."));
db.on("error", logger.error);

const setupHealthProbe = () =>
  new Promise(resolve => {
    healthProbeServer = net.createServer();
    healthProbeServer.on("error", logger.error.bind(null, "Health probe server error:"));

    healthProbeServer.listen(9090, () => {
      logger.info("Health probe server listening on port 9090.");
      resolve(void 0);
    });
  });

try {
  await mongoose.connect(MONGODB_URI);
  await amqpConnect();
  await setupHealthProbe();
} catch (error: any) {
  logger.error(`Startup error: ${error.message}`);
}

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

    mongoose.connection.close(false, () => {
      logger.info("Mongoose closed.");
      process.exit(0);
    });
  } catch (error) {
    logger.info(error);
    process.exitCode = 1;
  }
};

process.on("SIGINT", handleShutdown).on("SIGTERM", handleShutdown);
