const closeOnError = require('./closeOnError');

let publisherChannel;
const offlineQueue = [];
const startPublisher = async connection => {
  try {
    publisherChannel = await connection.createConfirmChannel();
    publisherChannel.on('error', error => {
      console.error('[AMQP] Channel error:\n', error.message);
    });
    publisherChannel.on('close', () => {});

    while (offlineQueue.length) {
      var job = offlineQueue.shift();
      if (!job) break;
      publishToQueue(job[0], job[1], job[2]);
    }
  } catch (error) {
    if (closeOnError(connection, error)) return;
  }
};

const publishToQueue = async (exchange, routingKey, data) => {
  const message = Buffer.from(JSON.stringify(data));
  try {
    await publisherChannel.publish(exchange, routingKey, message, {
      persistent: true
    });
  } catch (error) {
    offlineQueue.push([exchange, routingKey, message]);
    publisherChannel.connection.close();
  }
};

module.exports = {
  startPublisher,
  publishToQueue
};
