import "@gridfire/shared/types/express";
import "@gridfire/api/controllers/passport";
import logger from "@gridfire/api/controllers/logger";
import { clientErrorHandler, errorHandler, logErrors } from "@gridfire/api/middlewares/errorHandlers";
import artists from "@gridfire/api/routes/artistRoutes";
import artwork from "@gridfire/api/routes/artworkRoutes";
import auth from "@gridfire/api/routes/authRoutes";
import catalogue from "@gridfire/api/routes/catalogueRoutes";
import download from "@gridfire/api/routes/downloadRoutes";
import editions from "@gridfire/api/routes/editions";
import release from "@gridfire/api/routes/releaseRoutes";
import sse from "@gridfire/api/routes/sseRoutes";
import track from "@gridfire/api/routes/trackRoutes";
import user from "@gridfire/api/routes/userRoutes";
import web3 from "@gridfire/api/routes/web3Routes";
import { amqpClose, amqpConnect } from "@gridfire/shared/amqp";
import cookieParser from "cookie-parser";
import cookieSession from "cookie-session";
import express from "express";
import mongoose from "mongoose";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import passport from "passport";

const { COOKIE_KEY, MONGODB_URI, PORT = 5000 } = process.env;
let isReady = false;
let isShuttingDown = false;

assert(COOKIE_KEY, "COOKIE_KEY env var missing.");
assert(MONGODB_URI, "MONGODB_URI env var missing.");

process
  .on("uncaughtException", error => console.error("[API] Uncaught exception:", error))
  .on("unhandledRejection", error => console.error("[API] Unhandled promise rejection:", error));

const app = express();
const server = createServer(app);

// RabbitMQ
await amqpConnect().catch(logger.error);

// Mongoose
mongoose.set("strictQuery", true);
const db = mongoose.connection;
db.once("open", async () => logger.info("Mongoose connected."));
db.on("close", () => logger.info("Mongoose connection closed."));
db.on("disconnected", () => logger.warn("Mongoose disconnected."));
db.on("reconnected", () => logger.info("Mongoose reconnected."));
db.on("error", error => logger.error("Mongoose error:", error));
await mongoose.connect(MONGODB_URI).catch(error => logger.error("Mongoose connection error:", error));

// Express
app.use(express.json());
app.use(cookieParser(COOKIE_KEY));
app.use(cookieSession({ keys: [COOKIE_KEY], maxAge: 28 * 24 * 60 * 60 * 1000, name: "gridFireSession" }));
app.use(logErrors);
app.use(clientErrorHandler);
app.use(errorHandler);
app.use(passport.initialize());
app.use(passport.session());
app.use("/api/artist", artists);
app.use("/api/artwork", artwork);
app.use("/api/auth", auth);
app.use("/api/catalogue", catalogue);
app.use("/api/download", download);
app.use("/api/editions", editions);
app.use("/api/release", release);
app.use("/api/sse", sse);
app.use("/api/track", track);
app.use("/api/user", user);
app.use("/api/web3", web3);
app.use("/livez", (req, res) => void res.sendStatus(200));
app.use("/readyz", (req, res) => void res.sendStatus(isReady ? 200 : 400));

const handleShutdown = async () => {
  if (isShuttingDown) {
    logger.info("Shutdown already in progress.");
    return;
  }

  isReady = false;
  isShuttingDown = true;
  logger.info("Gracefully shutting down…");

  try {
    await amqpClose();
    await mongoose.connection.close(false);
    logger.info("Mongoose closed.");

    server.close(() => {
      logger.info("Express server closed.");
      process.exit(0);
    });
  } catch (error) {
    logger.info(error);
    process.exitCode = 1;
  }
};

process.on("SIGINT", handleShutdown).on("SIGTERM", handleShutdown);

server.listen(PORT, () => {
  logger.info(`Express server running on port ${PORT}.`);
  isReady = true;
});
