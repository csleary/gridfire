import onDaiApproval from "@gridfire/events/controllers/onDaiApproval";
import onEditionMinted from "@gridfire/events/controllers/onEditionMinted";
import onPurchase from "@gridfire/events/controllers/onPurchase";
import onPurchaseEdition from "@gridfire/events/controllers/onPurchaseEdition";
import onTransferSingle from "@gridfire/events/controllers/onTransferSingle";
import { amqpClose, amqpConnect } from "@gridfire/shared/amqp";
import Logger from "@gridfire/shared/logger";
import { MessageHandler } from "@gridfire/shared/types/amqp";
import GridfireProvider from "@gridfire/shared/web3/gridfireProvider";
import { contracts, DRPC, EventNames, LOCALHOST, providers } from "@gridfire/shared/web3/rpcProviders";
import mongoose from "mongoose";
import assert from "node:assert/strict";
import net from "node:net";
import onBalanceClaim from "./controllers/onBalanceClaim.js";

const { HEALTH_PROBE_PORT, INPUT_QUEUES, MONGODB_URI, NODE_ENV } = process.env;

const eventProviders = new Map(
  [...providers].filter(([key]) => {
    if (NODE_ENV !== "development") return ![DRPC, LOCALHOST].includes(key);
    return key === LOCALHOST;
  })
);

const logger = new Logger("app.ts");
let healthProbeServer: net.Server | null = null;
let gridfireProviders: GridfireProvider[] = [];
let isShuttingDown = false;

assert(HEALTH_PROBE_PORT, "HEALTH_PROBE_PORT env var missing.");
assert(INPUT_QUEUES, "INPUT_QUEUES env var missing.");
assert(MONGODB_URI, "MONGODB_URI env var missing.");

process
  .on("uncaughtException", error => logger.error("Uncaught exception:", error))
  .on("unhandledRejection", error => logger.error("Unhandled promise rejection:", error));

const handleShutdown = async () => {
  try {
    if (isShuttingDown) return;

    isShuttingDown = true;
    logger.info("Gracefully shutting down…");

    for (const gridfireProvider of gridfireProviders || []) {
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
  const provider = new GridfireProvider({ contracts, providers: eventProviders });

  provider
    .on(EventNames.EDITION_MINTED, onEditionMinted)
    .on(EventNames.PURCHASE_EDITION, onPurchaseEdition)
    .on(EventNames.PURCHASE, onPurchase)
    .on(EventNames.APPROVAL, onDaiApproval)
    .on(EventNames.CLAIM, onBalanceClaim)
    .on(EventNames.TRANSFER_SINGLE, onTransferSingle);

  gridfireProviders.push(provider);

  const messageHandler: MessageHandler = async message => {
    const { fromBlock, toBlock } = message;
    await provider.getLogs({ fromBlock, toBlock });
  };

  await Promise.all([mongoose.connect(MONGODB_URI), amqpConnect({ messageHandler }), setupHealthProbe()]);
} catch (error: any) {
  logger.error("Startup error:", error.message ?? error);
}
