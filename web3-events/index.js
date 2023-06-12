import "gridfire-web3-events/models/Activity.js";
import "gridfire-web3-events/models/Release.js";
import "gridfire-web3-events/models/Sale.js";
import "gridfire-web3-events/models/User.js";
import { amqpClose, amqpConnect } from "gridfire-web3-events/controllers/amqp/index.js";
import {
  getGridFireEditionsContract,
  getGridFirePaymentContract,
  onEditionMinted,
  onPurchase,
  onPurchaseEdition
} from "gridfire-web3-events/controllers/web3.js";
import { strict as assert } from "assert/strict";
import logger from "gridfire-web3-events/controllers/logger.js";
import mongoose from "mongoose";
import net from "net";

const { HEALTH_PROBE_PORT, MONGODB_URI } = process.env;
assert(HEALTH_PROBE_PORT, "Health probe port env var missing.");
assert(MONGODB_URI, "MongoDB connection URI env var missing.");

let healthProbeServer;

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

    healthProbeServer.listen(HEALTH_PROBE_PORT, () => {
      logger.info(`Health probe server listening on port ${HEALTH_PROBE_PORT}.`);
      resolve();
    });
  });

const handleShutdown = async () => {
  logger.info("Gracefully shutting down…");

  try {
    if (healthProbeServer) {
      logger.info("Closing health probe server…");

      await new Promise(resolve =>
        healthProbeServer.close(() => {
          logger.info("Health probe server closed.");
          resolve();
        })
      );
    }

    await amqpClose();
    logger.info("Closing Mongoose…");

    mongoose.connection.close(false, () => {
      logger.info("Mongoose closed.");
      process.exit(0);
    });
  } catch (error) {
    logger.error(error);
    process.exitCode = 1;
  }
};

process.on("SIGINT", handleShutdown).on("SIGTERM", handleShutdown);

try {
  await mongoose.connect(MONGODB_URI);
  await amqpConnect();
  await setupHealthProbe();
  const gridFirePayment = getGridFirePaymentContract();
  const gridFireEditions = getGridFireEditionsContract();
  gridFireEditions.on("EditionMinted", onEditionMinted);
  gridFireEditions.on("PurchaseEdition", onPurchaseEdition);
  gridFirePayment.on("Purchase", onPurchase);
} catch (error) {
  logger.error(`Startup error: ${error.message}`);
}
