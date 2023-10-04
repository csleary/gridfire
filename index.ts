import "gridfire/models/Activity.js";
import "gridfire/models/Artist.js";
import "gridfire/models/Edition.js";
import "gridfire/models/Favourite.js";
import "gridfire/models/Follower.js";
import "gridfire/models/Play.js";
import "gridfire/models/Release.js";
import "gridfire/models/Sale.js";
import "gridfire/models/StreamSession.js";
import "gridfire/models/User.js";
import "gridfire/models/WishList.js";
import "gridfire/controllers/passport.js";
import { amqpClose, amqpConnect } from "./controllers/amqp/index.js";
import { clientErrorHandler, errorHandler, logErrors } from "./middlewares/errorHandlers.js";
import artists from "./routes/artistRoutes.js";
import artwork from "./routes/artworkRoutes.js";
import auth from "./routes/authRoutes.js";
import catalogue from "./routes/catalogueRoutes.js";
import cookieParser from "cookie-parser";
import cookieSession from "cookie-session";
import { createServer } from "http";
import download from "./routes/downloadRoutes.js";
import express from "express";
import logger from "./controllers/logger.js";
import mongoose from "mongoose";
import passport from "passport";
import editions from "./routes/editions/index.js";
import release from "./routes/releaseRoutes.js";
import sse from "./routes/sseRoutes.js";
import track from "./routes/trackRoutes.js";
import user from "./routes/userRoutes.js";
import web3 from "./routes/web3Routes.js";
import assert from "assert/strict";

const { COOKIE_KEY, MONGODB_URI, PORT = 5000 } = process.env;
let isReady = false;

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
db.on("error", error => logger.info(`Mongoose error: ${error.message}`));
await mongoose.connect(MONGODB_URI).catch(logger.error);

// Express
app.use(express.json());
app.use(cookieParser(COOKIE_KEY));
app.use(cookieSession({ name: "gridFireSession", keys: [COOKIE_KEY], maxAge: 28 * 24 * 60 * 60 * 1000 }));
app.use(clientErrorHandler);
app.use(errorHandler);
app.use(logErrors);
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
app.use("/livez", (req, res) => res.sendStatus(200));
app.use("/readyz", (req, res) => (isReady ? res.sendStatus(200) : res.sendStatus(400)));

const handleShutdown = async () => {
  isReady = false;
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
