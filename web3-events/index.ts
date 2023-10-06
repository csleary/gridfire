import "gridfire-web3-events/models/Activity.js";
import "gridfire-web3-events/models/Edition.js";
import "gridfire-web3-events/models/Release.js";
import "gridfire-web3-events/models/Sale.js";
import "gridfire-web3-events/models/User.js";
import { PROVIDERS, contracts } from "gridfire-web3-events/controllers/web3/gridfireProvider/rpcProviders/index.js";
import { amqpClose, amqpConnect } from "gridfire-web3-events/controllers/amqp/index.js";
import GridfireProvider from "gridfire-web3-events/controllers/web3/gridfireProvider/index.js";
import onEditionMinted from "gridfire-web3-events/controllers/web3/onEditionMinted/index.js";
import onPurchase from "gridfire-web3-events/controllers/web3/onPurchase/index.js";
import onPurchaseEdition from "gridfire-web3-events/controllers/web3/onPurchaseEdition/index.js";
import { strict as assert } from "assert/strict";
import logger from "gridfire-web3-events/controllers/logger.js";
import mongoose from "mongoose";
import net from "net";

const { HEALTH_PROBE_PORT, MONGODB_URI, NODE_ENV } = process.env;
let healthProbeServer: net.Server | null = null;
let gridfireProvider: GridfireProvider;

assert(HEALTH_PROBE_PORT, "HEALTH_PROBE_PORT env var missing.");
assert(MONGODB_URI, "MONGODB_URI env var missing.");

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
  new Promise<void>(resolve => {
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
    if (gridfireProvider) {
      logger.info("Closing gridfireProvider…");
      gridfireProvider.destroy();
    }

    if (healthProbeServer != null) {
      logger.info("Closing health probe server…");

      await new Promise<void>(resolve =>
        healthProbeServer?.close(() => {
          logger.info("Health probe server closed.");
          resolve();
        })
      );
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

try {
  await mongoose.connect(MONGODB_URI);
  await amqpConnect();
  await setupHealthProbe();
  gridfireProvider = new GridfireProvider({ providers: PROVIDERS, contracts });

  gridfireProvider
    .on("EditionMinted", onEditionMinted)
    .on("PurchaseEdition", onPurchaseEdition)
    .on("Purchase", onPurchase)
    .on("error", (...errors) => logger.error(...errors));
} catch (error: any) {
  logger.error(`Startup error: ${error.message}`);
}
