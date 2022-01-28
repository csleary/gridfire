import express from "express";

const router = express.Router();

const scheduleCleanup = sseSessions => {
  const runCleanup = () => {
    const iterator = sseSessions.entries();

    const checkForStaleConnections = ({ value, done }) => {
      if (done) return;
      const [userId, { dateConnected }] = value;

      // Check if res object is older than a day.
      if (Date.now() - dateConnected > 1000 * 60 * 60 * 24) {
        sseSessions.delete(userId);
      }

      setTimeout(checkForStaleConnections, 0, iterator.next());
    };

    checkForStaleConnections(iterator.next());
  };

  setInterval(runCleanup, 1000 * 60 * 30); // Thirty minutes
};

router.use("/:userId", (req, res) => {
  const { userId } = req.params;
  const headers = { "Content-Type": "text/event-stream", Connection: "keep-alive", "Cache-Control": "no-cache" };
  res.writeHead(200, headers);
  res.write(`data: [SSE] Subscribed to events.\n\n`);
  const { sseSessions } = req.app.locals;
  sseSessions.set(userId, { res, dateConnected: Date.now() });

  req.on("close", () => {
    res.end();
    if (sseSessions.has(userId)) sseSessions.delete(userId);
  });
});

export { scheduleCleanup, router as default };
