import { clientErrorHandler, errorHandler, logErrors } from "./middlewares/errorHandlers.js";
import SSEController from "./controllers/sseController.js";
import express from "express";
import amqp from "./controllers/amqp/index.js";
import cookieParser from "cookie-parser";
import cookieSession from "cookie-session";
import { create } from "ipfs-http-client";
import mongoose from "mongoose";
import passport from "passport";
import "./models/Artist.js";
import "./models/Favourite.js";
import "./models/Release.js";
import "./models/Sale.js";
import "./models/Play.js";
import "./models/StreamSession.js";
import "./models/User.js";
import "./models/Wishlist.js";
import "./controllers/passport.js";
import artists from "./routes/artistRoutes.js";
import artwork from "./routes/artworkRoutes.js";
import auth from "./routes/authRoutes.js";
import catalogue from "./routes/catalogueRoutes.js";
import { createServer } from "http";
import download from "./routes/downloadRoutes.js";
import { generateKey } from "./controllers/encryption.js";
import release from "./routes/releaseRoutes.js";
import sse from "./routes/sseRoutes.js";
import track from "./routes/trackRoutes.js";
import user from "./routes/userRoutes.js";

const { COOKIE_KEY, IPFS_NODE_HOST, MONGODB_URI, PORT = 5000 } = process.env;
let isReady = false;

process
  .on("uncaughtException", error => console.error("[API] Unhandled exception:", error))
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
const db = mongoose.connection;
db.once("open", async () => console.log("[API][Mongoose] Connected."));
db.on("close", () => console.log("[API][Mongoose] Connection closed."));
db.on("disconnected", () => console.log("[API][Mongoose] Disconnected."));
db.on("error", error => console.log(`[API][Mongoose] Error: ${error.message}`));
await mongoose.connect(MONGODB_URI).catch(console.error);

// Express
app.locals.sse = sseController;
app.locals.crypto = await generateKey();
app.use(express.json());
app.use(cookieParser(COOKIE_KEY));
app.use(cookieSession({ name: "gridFireSession", keys: [COOKIE_KEY], maxAge: 28 * 24 * 60 * 60 * 1000 }));
app.use(clientErrorHandler);
app.use(errorHandler);
app.use(logErrors);
app.use(passport.initialize());
app.use(passport.session());
app.use("/api/artists", artists);
app.use("/api/artwork", artwork);
app.use("/api/auth", auth);
app.use("/api/catalogue", catalogue);
app.use("/api/download", download);
app.use("/api/release", release);
app.use("/api/sse", sse);
app.use("/api/track", track);
app.use("/api/user", user);
app.use("/livez", (req, res) => res.sendStatus(200));
app.use("/readyz", (req, res) => (isReady ? res.sendStatus(200) : res.sendStatus(400)));

const handleShutdown = async () => {
  isReady = false;
  console.log("[API] Gracefully shutting down…");

  try {
    if (amqpConnection) {
      await consumerChannel.cancel(consumerTag);
      await amqpConnection.close.bind(amqpConnection);
      console.log("[API][AMQP] Closed.");
    }

    mongoose.connection.close(false, () => {
      server.close(() => {
        console.log("[API][Express] Server closed.");
        process.exit(0);
      });
    });
  } catch (error) {
    console.log(error);
    process.exit(0);
  }
};

process.on("SIGINT", handleShutdown).on("SIGTERM", handleShutdown);

server.listen(PORT, () => {
  console.log(`[API][Express] Server running on port ${PORT}.`);
  isReady = true;
});
