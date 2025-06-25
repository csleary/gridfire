import { publishToQueue } from "@gridfire/shared/amqp";
import sseClient from "@gridfire/shared/sseController";
import express from "express";
import { UUID } from "node:crypto";

const router = express.Router();

router.get("/:userId/:uuid", async (req, res) => {
  const { userId, uuid } = req.params;

  req.on("close", () => {
    console.log(`[SSE] Connection [${uuid}] closed for user ${userId}`);
    sseClient.remove(userId);
  });

  const headers = { "Content-Type": "text/event-stream", Connection: "keep-alive", "Cache-Control": "no-cache" };
  res.writeHead(200, headers);
  res.write("data: [SSE] Subscribed to events.\n\n");
  await sseClient.add(res, userId, uuid as UUID);
});

router.get("/:userId/:uuid/ping", (req, res) => {
  const { userId, uuid } = req.params;
  publishToQueue("user", userId, { ping: true, userId, uuid });
  res.sendStatus(200);
});

export default router;
