import { amqpClose, amqpConnect, publishToQueue } from "@gridfire/shared/amqp";
import Logger from "@gridfire/shared/logger";
import Block from "@gridfire/shared/models/Block";
import GridfireProvider from "@gridfire/shared/web3/gridfireProvider";
import { blockProviders as providers } from "@gridfire/shared/web3/rpcProviders";
import mongoose from "mongoose";
import assert from "node:assert/strict";
import net from "node:net";

const { CHECK_INTERVAL_SECONDS = "10", RANGE_SIZE = "50", HEALTH_PROBE_PORT, MONGODB_URI, NODE_ENV } = process.env;
const logger = new Logger("app.ts");
let gridfireProviders: GridfireProvider[] = [];
let healthProbeServer: net.Server | null = null;
let isShuttingDown = false;
let timeoutHandle: NodeJS.Timeout | null = null;

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

    if (timeoutHandle) {
      logger.info("Clearing dispatcher interval handle…");
      clearTimeout(timeoutHandle);
      timeoutHandle = null;
    }

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
  await Promise.all([mongoose.connect(MONGODB_URI), amqpConnect(), setupHealthProbe()]);
  logger.info(`Current block range size: ${RANGE_SIZE}.`);
  logger.info(`Current block check interval: ${CHECK_INTERVAL_SECONDS} seconds.`);
  const LAST_QUEUED_BLOCK_ID = "arbitrum_dispatcher";
  const rangeSize = Number(RANGE_SIZE);
  const quorum = NODE_ENV === "production" ? 2 : 1;
  const provider = new GridfireProvider({ providers, quorum });
  gridfireProviders.push(provider);

  const dispatchBlockRange = async () => {
    const doc = await Block.findById(LAST_QUEUED_BLOCK_ID).lean();
    const { lastQueuedBlock = null } = doc ?? {};
    const latestBlock = await provider.getBlockNumber({ finalised: true });
    let rangeStart = lastQueuedBlock ?? latestBlock - rangeSize - 1;

    while (rangeStart + rangeSize < latestBlock) {
      const fromBlock = `0x${(++rangeStart).toString(16)}`;
      const endBlock = rangeStart + rangeSize;
      const toBlock = `0x${endBlock.toString(16)}`;
      await publishToQueue("", "blocks", { fromBlock, toBlock });
      logger.info(`Last queued block range: ${rangeStart}-${endBlock}`);
      rangeStart += rangeSize;
      await new Promise(resolve => setTimeout(resolve, 1000)); // Throttle dispatches
    }

    await Block.updateOne(
      { _id: LAST_QUEUED_BLOCK_ID },
      { lastQueuedBlock: rangeStart, lastQueuedBlockHex: rangeStart.toString(16) },
      { upsert: true }
    );

    timeoutHandle = setTimeout(dispatchBlockRange, Number.parseInt(CHECK_INTERVAL_SECONDS) * 1000);
  };

  await dispatchBlockRange();
} catch (error: any) {
  logger.error("Startup error:", error.message ?? error);
}
