import { publishToQueue } from "@gridfire/shared/amqp";
import sseClient from "@gridfire/shared/sseController";
import { MessageType } from "@gridfire/shared/types";
import { Router } from "express";
import { UUID } from "node:crypto";

const router = Router();

router.get("/:userId/:uuid", async (req, res) => {
  const { userId, uuid } = req.params;

  req.on("close", () => {
    console.log(`[SSE] Connection [${uuid}] closed for user ${userId}`);
    sseClient.remove(userId);
  });

  const headers = { "Cache-Control": "no-cache", Connection: "keep-alive", "Content-Type": "text/event-stream" };
  res.writeHead(200, headers);
  res.write("data: [SSE] Subscribed to events.\n\n");
  await sseClient.add(res, userId, uuid as UUID);
});

router.get("/:userId/:uuid/ping", (req, res) => {
  const { userId, uuid } = req.params;
  publishToQueue("user", userId, { type: MessageType.Ping, userId, uuid: uuid as UUID });
  res.sendStatus(200);
});

export default router;
