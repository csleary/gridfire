import { publishToQueue } from "@gridfire/shared/amqp";
import sseClient from "@gridfire/shared/sseController";
import express from "express";
import { UUID } from "node:crypto";

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
  await sseClient.add(res, userId, uuid as UUID);
  res.write("data: [SSE] Subscribed to events.\n\n");
});

router.get("/:userId/:uuid/ping", (req, res) => {
  const { userId, uuid } = req.params;
  const connections = sseClient.get(userId);

  if (!connections) {
    return void res.sendStatus(404);
  }

  publishToQueue("user", userId, { ping: true, userId, uuid });
  res.sendStatus(200);
});

router.delete("/:userId/:uuid", (req, res) => {
  const { userId, uuid } = req.params;
  const connections = sseClient.get(userId);

  if (connections) {
    connections.delete(uuid as UUID);
    if (connections.size === 0) sseClient.remove(userId);
  }

  res.sendStatus(200);
});

export default router;
