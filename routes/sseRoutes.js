import express from "express";
import { publishToQueue } from "gridfire/controllers/amqp/publisher.js";

const router = express.Router();

router.get("/:userId/:uuid", async (req, res) => {
  req.on("close", () => console.log(`[SSE] Connection [${uuid}] closed for user ${userId}`));
  const { userId, uuid } = req.params;

  const headers = {
    "Content-Type": "text/event-stream",
    Connection: "keep-alive",
    "Cache-Control": "no-cache"
  };

  res.writeHead(200, headers);
  const { sse } = req.app.locals;
  await sse.add(res, userId, uuid);
  res.write("data: [SSE] Subscribed to events.\n\n");
});

router.get("/:userId/:uuid/ping", (req, res) => {
  const { userId, uuid } = req.params;
  publishToQueue("user", userId, { ping: true, userId, uuid });
  res.sendStatus(200);
});

router.delete("/:userId/:uuid", (req, res) => {
  const { userId, uuid } = req.params;
  const { sse } = req.app.locals;
  const connections = sse.get(userId);

  if (connections) {
    connections.delete(uuid);
    if (connections.size === 0) sse.remove(userId);
  }

  res.sendStatus(200);
});

export default router;
