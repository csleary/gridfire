import closeOnError from '../closeOnError.js';

let channel;
const offlineQueue = [];

const publishToQueue = (exchange, routingKey, message) => {
  const data = Buffer.from(JSON.stringify(message));
  try {
    channel.publish(exchange, routingKey, data, { persistent: true });
  } catch (error) {
    offlineQueue.push([exchange, routingKey, data]);
    if (channel) channel.connection.close();
  }
};

const startPublisher = async connection => {
  try {
    channel = await connection.createConfirmChannel();
    channel.on('error', error => console.error('[AMQP] Channel error: ', error.message));

    while (offlineQueue.length) {
      const job = offlineQueue.shift();
      if (!job) break;
      const [exchange, routingKey, data] = job;
      publishToQueue(exchange, routingKey, data);
    }
  } catch (error) {
    if (closeOnError(connection, error)) return;
  }
};

export { startPublisher as default, publishToQueue };
