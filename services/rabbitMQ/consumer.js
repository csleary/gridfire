const closeOnError = require('./closeOnError');
const handleWork = require('./worker');
const path = require('path');

const scripts = {
  encodeFlac: path.join(__dirname, 'workerScripts', 'encodeFlac.js'),
  transcodeAac: path.join(__dirname, 'workerScripts', 'transcodeAac.js'),
  uploadArtwork: path.join(__dirname, 'workerScripts', 'uploadArtwork.js')
};

const startConsumer = async ({ connection, io, workerPool, queue }) => {
  try {
    const consumerChannel = await connection.createChannel();
    const processMessage = async message => {
      try {
        const workerData = JSON.parse(message.content.toString());
        const workerScript = scripts[workerData.job];
        const success = await handleWork(io, workerPool, workerData, workerScript);

        if (success) {
          consumerChannel.ack(message);
        } else {
          consumerChannel.nack(message, false, false);
        }
      } catch (error) {
        consumerChannel.nack(message, false, false);
        closeOnError(connection, error);
      }
    };

    consumerChannel.on('close', () => {});
    consumerChannel.on('error', error => {
      console.error('[AMQP] Channel error:\n', error.message);
    });

    consumerChannel.prefetch(1);
    await consumerChannel.assertQueue(queue, { durable: true });
    consumerChannel.consume(queue, processMessage, { noAck: false });
  } catch (error) {
    if (closeOnError(connection, error)) return;
  }
};

module.exports = startConsumer;
