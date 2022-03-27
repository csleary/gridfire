class SSEController {
  #interval;
  #sessions;

  constructor() {
    this.#interval = null;
    this.#sessions = new Map();
    this.#runHouseKeeping();
  }

  add(res, userId, uuid) {
    if (this.#has(userId)) {
      const connections = this.get(userId);

      if (connections.has(uuid)) {
        console.log(`[SSE] Closing existing connection [${uuid}] for user ${userId}…`);
        connections.get(uuid).res.end();
      }

      console.log(`[SSE] Storing additional connection [${uuid}] for user ${userId}…`);
      return connections.set(uuid, { res, dateConnected: Date.now() });
    }

    console.log(`[SSE] Storing first connection [${uuid}] for user ${userId}…`);
    const connections = new Map();
    connections.set(uuid, { res, dateConnected: Date.now() });
    this.#sessions.set(userId, connections);
  }

  get(userId) {
    return this.#sessions.get(userId.toString());
  }

  remove(userId) {
    console.log(`[SSE] Removing connection for user ${userId}…`);
    this.#sessions.delete(userId);
  }

  #has(userId) {
    return this.#sessions.has(userId);
  }

  #runHouseKeeping() {
    if (this.#interval) clearInterval(this.#interval);

    const checkUserConnections = () => {
      console.log("[SSE] Checking for stale sockets…");
      const iterator = this.#sessions.entries();

      const checkForStaleConnection = ({ value: [userId, connections] = [], done }) => {
        if (done) return;
        console.log(`[SSE] User ${userId} has ${connections.size} connections.`);

        for (const [uuid, { dateConnected, res }] of connections.entries()) {
          // Check if res object is older than a day: 1000 * 60 * 60 * 24
          if (Date.now() - dateConnected > 1000 * 60 * 60 * 24) {
            console.log(`[SSE] Stale connection [${uuid}] found for user ${userId}.`);
            res.end();
            connections.delete(uuid);
          }
        }

        if (connections.size === 0) this.remove(userId);
        setTimeout(checkForStaleConnection, 0, iterator.next());
      };

      checkForStaleConnection(iterator.next());
    };

    this.#interval = setInterval(checkUserConnections, 1000 * 60 * 15); // 15 minutes
  }

  send(userId, { type, ...message } = {}) {
    // console.log(`[SSE] Fetching connections for user ${userId}…`);
    const connections = this.get(userId.toString());
    if (!connections) return;

    connections.forEach(({ res }) => {
      // console.log(`[SSE] Sending message for user ${userId}: ${JSON.stringify(message)}`);
      const data = JSON.stringify(message);

      if (type) {
        res.write(`event: ${type}\n`);
        res.write(`data: ${data}\n\n`);
      } else {
        res.write("event: workerMessage\n");
        res.write(`data: ${data}\n\n`);
      }
    });
  }
}

export default SSEController;
