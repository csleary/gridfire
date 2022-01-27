import express from "express";

const router = express.Router();

router.use("/:userId", (req, res) => {
  const { userId } = req.params;
  const headers = { "Content-Type": "text/event-stream", Connection: "keep-alive", "Cache-Control": "no-cache" };
  res.writeHead(200, headers);
  res.write(`data: [SSE] User [${userId}] subscribed to updates.\n\n`);
  const { sseSessions } = req.app.locals;
  sseSessions.set(userId, res);

  req.on("close", () => {
    res.end();
    if (sseSessions.has(userId)) sseSessions.delete(userId);
  });
});

export default router;
