import express from "express";

const router = express.Router();

router.use("/:userId/:uuid", (req, res) => {
  const { userId, uuid } = req.params;
  const headers = { "Content-Type": "text/event-stream", Connection: "keep-alive", "Cache-Control": "no-cache" };
  res.writeHead(200, headers);
  const { sse } = req.app.locals;
  sse.add(res, userId, uuid);
  res.write(`data: [SSE] Subscribed to events.\n\n`);
  req.on("close", () => console.log(`[SSE] Connection [${uuid}] closed for user ${userId}`));
});

export default router;
