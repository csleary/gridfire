class SSEController {
  constructor() {
    this.interval = null;
    this.sessions = new Map();
    this.runHouseKeeping();
  }

  add(res, userId) {
    if (this.has(userId)) {
      console.log(`[SSE] Closing existing for user ${userId}…`);
      this.get(userId).res.end();
    }
    console.log(`[SSE] Adding socket for user ${userId}…`);
    this.sessions.set(userId, { res, dateConnected: Date.now() });
  }

  get(userId) {
    return this.sessions.get(userId.toString());
  }

  remove(userId) {
    console.log(`[SSE] Removing socket for user ${userId}…`);
    this.sessions.delete(userId);
  }

  has(userId) {
    return this.sessions.has(userId);
  }

  runHouseKeeping() {
    if (this.interval) clearInterval(this.interval);

    const checkUserSockets = () => {
      const iterator = this.sessions.entries();

      const checkForStaleSocket = ({ value, done }) => {
        if (done) return;
        const [userId, { dateConnected }] = value;

        // Check if res object is older than a day: 1000 * 60 * 60 * 24
        if (Date.now() - dateConnected > 1000 * 60 * 60 * 24) {
          console.log(`[SSE] Stale socket found for user ${userId}.`);
          this.remove(userId);
        }

        setTimeout(checkForStaleSocket, 0, iterator.next());
      };

      checkForStaleSocket(iterator.next());
    };

    this.interval = setInterval(checkUserSockets, 1000 * 60 * 15); // 15 minutes
  }

  send(userId, { type, ...message } = {}) {
    console.log(`[SSE] Fetching socket for user ${userId}…`);
    const { res } = this.get(userId.toString()) || {};
    if (!res) return;
    console.log(`[SSE] Sending message for user ${userId}: ${JSON.stringify(message)}`);
    const data = JSON.stringify(message);

    if (type) {
      res.write(`event: ${type}\n`);
      res.write(`data: ${data}\n\n`);
    } else {
      res.write("event: workerMessage\n");
      res.write(`data: ${data}\n\n`);
    }
  }
}

export default SSEController;
