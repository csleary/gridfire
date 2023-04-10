import "gridfire/models/Artist.js";
import "gridfire/models/Edition.js";
import "gridfire/models/Favourite.js";
import "gridfire/models/Follower.js";
import "gridfire/models/Release.js";
import "gridfire/models/Sale.js";
import "gridfire/models/Play.js";
import "gridfire/models/StreamSession.js";
import "gridfire/models/User.js";
import "gridfire/models/WishList.js";
import "gridfire/controllers/passport.js";
import { clientErrorHandler, errorHandler, logErrors } from "./middlewares/errorHandlers.js";
import SSEController from "./controllers/sseController.js";
import amqp from "./controllers/amqp/index.js";
import artists from "./routes/artistRoutes.js";
import artwork from "./routes/artworkRoutes.js";
import auth from "./routes/authRoutes.js";
import catalogue from "./routes/catalogueRoutes.js";
import cookieParser from "cookie-parser";
import cookieSession from "cookie-session";
import { create } from "ipfs-http-client";
import { createServer } from "http";
import download from "./routes/downloadRoutes.js";
import express from "express";
import mongoose from "mongoose";
import passport from "passport";
import release from "./routes/releaseRoutes.js";
import sse from "./routes/sseRoutes.js";
import track from "./routes/trackRoutes.js";
import user from "./routes/userRoutes.js";
import web3 from "./routes/web3Routes.js";

const { COOKIE_KEY, IPFS_NODE_HOST, MONGODB_URI, PORT = 5000 } = process.env;
let isReady = false;

process
  .on("uncaughtException", error => console.error("[API] Uncaught exception:", error))
  .on("unhandledRejection", error => console.error("[API] Unhandled promise rejection:", error));

const app = express();
const server = createServer(app);
const sseController = new SSEController();

// IPFS
const ipfs = create(IPFS_NODE_HOST);
app.locals.ipfs = ipfs;

// RabbitMQ
const [amqpConnection, consumerChannel, consumerTag] = await amqp(sseController).catch(console.error);

// Mongoose
mongoose.set("strictQuery", true);
const db = mongoose.connection;
db.once("open", async () => console.log("[API] Mongoose connected."));
db.on("close", () => console.log("[API] Mongoose connection closed."));
db.on("disconnected", () => console.warn("[API] Mongoose disconnected."));
db.on("reconnected", () => console.log("[API] Mongoose reconnected."));
db.on("error", error => console.log(`[API] Mongoose error: ${error.message}`));
await mongoose.connect(MONGODB_URI).catch(console.error);

// Express
app.locals.sse = sseController;
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
app.use("/api/release", release);
app.use("/api/sse", sse);
app.use("/api/track", track);
app.use("/api/user", user);
app.use("/api/web3", web3);
app.use("/livez", (req, res) => res.sendStatus(200));
app.use("/readyz", (req, res) => (isReady ? res.sendStatus(200) : res.sendStatus(400)));

const handleShutdown = async () => {
  isReady = false;
  console.log("[API] Gracefully shutting down…");

  try {
    if (amqpConnection) {
      await consumerChannel.cancel(consumerTag);
      await amqpConnection.close.bind(amqpConnection);
      console.log("[API] AMQP closed.");
    }

    mongoose.connection.close(false, () => {
      server.close(() => {
        console.log("[API] Express server closed.");
        process.exit(0);
      });
    });
  } catch (error) {
    console.log(error);
    process.exitCode = 1;
  }
};

process.on("SIGINT", handleShutdown).on("SIGTERM", handleShutdown);

server.listen(PORT, () => {
  console.log(`[API] Express server running on port ${PORT}.`);
  isReady = true;
});
