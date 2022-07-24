const CHECK_INTERVAL = 1000 * 60 * 5;

class SSEController {
  #consumerChannel;
  #consumerTags;
  #messageHandler;
  #interval;
  #sessions;

  constructor() {
    this.#consumerTags = new Map();
    this.#interval = null;
    this.#sessions = new Map();
    this.#runHouseKeeping();
  }

  async add(res, userId, uuid) {
    if (this.#has(userId)) {
      const connections = this.get(userId);

      if (connections.has(uuid)) {
        console.log(`[SSE] Closing existing connection [${uuid}] for user ${userId}…`);
        connections.get(uuid).res.end();
      }

      console.log(`[SSE] Storing additional connection [${uuid}] for user ${userId}…`);
      return connections.set(uuid, { res, lastPing: Date.now() });
    }

    console.log(`[SSE] Storing first connection [${uuid}] for user ${userId}…`);
    const connections = new Map();
    connections.set(uuid, { res, lastPing: Date.now() });
    this.#sessions.set(userId, connections);
    const queueOptions = { autoDelete: true, durable: false, exclusive: true };
    const userQueue = `user.${userId}`;
    await this.#consumerChannel.assertQueue(userQueue, queueOptions);
    await this.#consumerChannel.bindQueue(userQueue, "user", userId);
    const { consumerTag } = await this.#consumerChannel.consume(userQueue, this.#messageHandler, { noAck: false });
    this.#consumerTags.set(userId, consumerTag);
  }

  get(userId) {
    return this.#sessions.get(userId.toString());
  }

  #has(userId) {
    return this.#sessions.has(userId);
  }

  ping(userId, uuid) {
    const connections = this.get(userId);
    if (!connections) return void this.#sessions.delete(userId);
    connections.set(uuid, { ...connections.get(uuid), lastPing: Date.now() });
  }

  async remove(userId) {
    console.log(`[SSE] Removing connection for user ${userId}…`);
    this.#sessions.delete(userId);
    const userQueue = `user.${userId}`;
    await this.#consumerChannel.unbindQueue(userQueue, "user", userId);
    const consumerTag = this.#consumerTags.get(userId);
    await this.#consumerChannel.cancel(consumerTag);
  }

  #runHouseKeeping() {
    if (this.#interval) clearInterval(this.#interval);

    const checkUserConnections = () => {
      // console.log("[SSE] Checking for stale sockets…");
      const iterator = this.#sessions.entries();

      const checkForStaleConnection = ({ value: [userId, connections] = [], done }) => {
        if (done) return;
        // console.log(`[SSE] User ${userId} has ${connections.size} connections.`);

        for (const [uuid, { lastPing, res }] of connections.entries()) {
          if (Date.now() - lastPing > CHECK_INTERVAL) {
            console.log(`[SSE] Removing stale connection [${uuid}] for user ${userId}.`);
            res.end();
            connections.delete(uuid);
          }
        }

        if (connections.size === 0) this.remove(userId);
        setTimeout(checkForStaleConnection, 0, iterator.next());
      };

      checkForStaleConnection(iterator.next());
    };

    this.#interval = setInterval(checkUserConnections, CHECK_INTERVAL);
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

  setConsumerChannel(channel, messageHandler) {
    this.#consumerChannel = channel;
    this.#messageHandler = messageHandler;
  }
}

export default SSEController;
