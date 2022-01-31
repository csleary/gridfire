import express from "express";

const router = express.Router();

router.use("/:userId", (req, res) => {
  const { userId } = req.params;
  const headers = { "Content-Type": "text/event-stream", Connection: "keep-alive", "Cache-Control": "no-cache" };
  res.writeHead(200, headers);
  res.write(`data: [SSE] Subscribed to events.\n\n`);
  const { sse } = req.app.locals;
  sse.add(res, userId);
  req.on("close", () => console.log(`[SSE] Connection closed for user ${userId}`));
});

export default router;
