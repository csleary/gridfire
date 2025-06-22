import "@gridfire/shared/models/Activity.js";
import "@gridfire/shared/models/Artist.js";
import "@gridfire/shared/models/Edition.js";
import "@gridfire/shared/models/Favourite.js";
import "@gridfire/shared/models/Follower.js";
import "@gridfire/shared/models/Play.js";
import "@gridfire/shared/models/Release.js";
import "@gridfire/shared/models/Sale.js";
import "@gridfire/shared/models/StreamSession.js";
import "@gridfire/shared/models/User.js";
import "@gridfire/shared/models/WishList.js";
import "@gridfire/api/controllers/passport.js";
import { clientErrorHandler, errorHandler, logErrors } from "@gridfire/api/middlewares/errorHandlers.js";
import artists from "@gridfire/api/routes/artistRoutes.js";
import artwork from "@gridfire/api/routes/artworkRoutes.js";
import auth from "@gridfire/api/routes/authRoutes.js";
import catalogue from "@gridfire/api/routes/catalogueRoutes.js";
import download from "@gridfire/api/routes/downloadRoutes.js";
import editions from "@gridfire/api/routes/editions/index.js";
import release from "@gridfire/api/routes/releaseRoutes.js";
import sse from "@gridfire/api/routes/sseRoutes.js";
import track from "@gridfire/api/routes/trackRoutes.js";
import user from "@gridfire/api/routes/userRoutes.js";
import web3 from "@gridfire/api/routes/web3Routes.js";
import { amqpClose, amqpConnect } from "@gridfire/shared/amqp";
import Logger from "@gridfire/shared/logger";
import cookieParser from "cookie-parser";
import cookieSession from "cookie-session";
import express from "express";
import mongoose from "mongoose";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import passport from "passport";

const { COOKIE_KEY, MONGODB_URI, PORT = 5000 } = process.env;
const logger = new Logger("API");
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
app.use(cookieSession({ name: "gridFireSession", keys: [COOKIE_KEY], maxAge: 28 * 24 * 60 * 60 * 1000 }));
app.use(clientErrorHandler);
app.use(errorHandler);
app.use(logErrors);
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
app.use("/readyz", (req, res) => (isReady ? void res.sendStatus(200) : void res.sendStatus(400)));

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
