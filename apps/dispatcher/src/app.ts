import { amqpClose, amqpConnect, publishToQueue } from "@gridfire/shared/amqp";
import Logger from "@gridfire/shared/logger";
import Block from "@gridfire/shared/models/Block";
import { MessageType } from "@gridfire/shared/types";
import GridfireProvider from "@gridfire/shared/web3/gridfireProvider";
import { LOCALHOST, providers } from "@gridfire/shared/web3/rpcProviders";
import mongoose from "mongoose";
import assert from "node:assert/strict";
import net from "node:net";

const {
  CHECK_INTERVAL_SECONDS = "10",
  DISABLED_PROVIDERS,
  HEALTH_PROBE_PORT,
  MONGODB_URI,
  NODE_ENV,
  QUORUM = NODE_ENV !== "development" ? 2 : 1,
  RANGE_SIZE = "50"
} = process.env;

const disabledProviders = DISABLED_PROVIDERS ? DISABLED_PROVIDERS.split(",").map(p => p.trim()) : [];

const blockProviders = new Map(
  Array.from(providers).filter(([key]) => {
    if (NODE_ENV !== "production") {
      return key === LOCALHOST;
    }
    return key !== LOCALHOST && key.description && !disabledProviders.includes(key.description!);
  })
);

const logger = new Logger("app.ts");
const gridfireProviders: GridfireProvider[] = [];
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
  const LAST_QUEUED_BLOCK_ID = "arbitrum_dispatcher";
  const rangeSize = NODE_ENV !== "development" ? Number(RANGE_SIZE) : 10;
  logger.info(`Current block range size: ${rangeSize}.`);
  logger.info(`Current block check interval: ${CHECK_INTERVAL_SECONDS} seconds.`);
  const provider = new GridfireProvider({ providers: blockProviders, quorum: Number(QUORUM) });
  gridfireProviders.push(provider);

  const dispatchBlockRange = async () => {
    try {
      const lastQueuedInfo = await Block.findById(LAST_QUEUED_BLOCK_ID).lean();
      const { lastQueuedBlock = null } = lastQueuedInfo ?? {};
      const latestBlock = await provider.getBlockNumber({ finalised: true });
      let rangeStart = lastQueuedBlock ? lastQueuedBlock + 1 : latestBlock;

      while (rangeStart + rangeSize < latestBlock) {
        const rangeEnd = rangeStart + rangeSize;
        const fromBlock = `0x${rangeStart.toString(16)}`;
        const toBlock = `0x${rangeEnd.toString(16)}`;
        await publishToQueue("", "blocks", { fromBlock, toBlock, type: MessageType.BlockRange });
        logger.info(`Last queued block range: ${rangeStart}-${rangeEnd}`);

        await Block.updateOne(
          { _id: LAST_QUEUED_BLOCK_ID },
          { lastQueuedBlock: rangeEnd, lastQueuedBlockHex: rangeEnd.toString(16) },
          { upsert: true }
        );

        rangeStart += rangeSize + 1;
        // Throttle catch-up dispatches to avoid hitting provider frequency limits.
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      timeoutHandle = setTimeout(dispatchBlockRange, Number.parseInt(CHECK_INTERVAL_SECONDS) * 1000);
    } catch (error) {
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
        timeoutHandle = null;
      }

      logger.error("Error dispatching block range:", error);
      setTimeout(dispatchBlockRange, 5000); // Delay dispatch attempt.
    }
  };

  await dispatchBlockRange();
} catch (error: unknown) {
  if (error instanceof Error) {
    logger.error("Startup error:", error.message ?? error);
  }
}
