import GridfireProvider from "@gridfire/events/controllers/web3/gridfireProvider";
import onDaiApproval from "@gridfire/events/controllers/web3/onDaiApproval";
import onEditionMinted from "@gridfire/events/controllers/web3/onEditionMinted";
import onPurchase from "@gridfire/events/controllers/web3/onPurchase";
import onPurchaseEdition from "@gridfire/events/controllers/web3/onPurchaseEdition";
import onTransferSingle from "@gridfire/events/controllers/web3/onTransferSingle";
import { contracts, EventNames, PROVIDERS } from "@gridfire/events/controllers/web3/rpcProviders";
import { amqpClose, amqpConnect } from "@gridfire/shared/amqp";
import Logger from "@gridfire/shared/logger";
import mongoose from "mongoose";
import assert from "node:assert/strict";
import net from "node:net";
import onBalanceClaim from "./controllers/web3/onBalanceClaim.js";

const { HEALTH_PROBE_PORT, MONGODB_URI } = process.env;
const logger = new Logger("Events");
let healthProbeServer: net.Server | null = null;
let gridfireProvider: GridfireProvider;
let isShuttingDown = false;

assert(HEALTH_PROBE_PORT, "HEALTH_PROBE_PORT env var missing.");
assert(MONGODB_URI, "MONGODB_URI env var missing.");

process
  .on("uncaughtException", error => logger.error("Uncaught exception:", error))
  .on("unhandledRejection", error => logger.error("Unhandled promise rejection:", error));

const handleShutdown = async () => {
  try {
    if (isShuttingDown) return;

    isShuttingDown = true;
    logger.info("Gracefully shutting down…");

    if (gridfireProvider) {
      logger.info("Closing gridfireProvider…");
      gridfireProvider.destroy();
    }

    if (healthProbeServer !== null) {
      logger.info("Closing health probe server…");

      await new Promise(resolve => {
        if (!healthProbeServer) {
          return resolve(void 0);
        }

        healthProbeServer.close(() => {
          logger.info("Health probe server closed.");
          resolve(void 0);
        });
      });
    }

    await amqpClose();
    logger.info("Closing Mongoose…");
    await mongoose.connection.close(false);
    logger.info("Mongoose closed.");
    process.exit(0);
  } catch (error) {
    logger.error(error);
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

    healthProbeServer.listen(HEALTH_PROBE_PORT, () => {
      logger.info(`Health probe server listening on port ${HEALTH_PROBE_PORT}.`);
      resolve(void 0);
    });
  });

try {
  await Promise.all([mongoose.connect(MONGODB_URI), amqpConnect(), setupHealthProbe()]);
  gridfireProvider = new GridfireProvider({ providers: PROVIDERS, contracts });

  gridfireProvider
    .on(EventNames.APPROVAL, onDaiApproval)
    .on(EventNames.CLAIM, onBalanceClaim)
    .on(EventNames.EDITION_MINTED, onEditionMinted)
    .on(EventNames.PURCHASE_EDITION, onPurchaseEdition)
    .on(EventNames.PURCHASE, onPurchase)
    .on(EventNames.TRANSFER_SINGLE, onTransferSingle)
    .on("error", (...errors) => logger.error(...errors));
} catch (error: any) {
  logger.error("Startup error:", error.message ?? error);
}
