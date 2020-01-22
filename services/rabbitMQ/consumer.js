const closeOnError = require('./closeOnError');
const handleWork = require('./worker');
const path = require('path');

const scripts = {
  encodeFLAC: path.join(__dirname, 'workerScripts', 'encodeFLAC.js'),
  transcodeAAC: path.join(__dirname, 'workerScripts', 'transcodeAAC.js'),
  uploadArtwork: path.join(__dirname, 'workerScripts', 'artwork.js')
};

const startConsumer = async ({ connection, io, workerPool, queue }) => {
  const ioEmit = require('./ioEmit')(io);

  try {
    const consumerChannel = await connection.createChannel();
    const processMessage = async message => {
      try {
        const workerData = JSON.parse(message.content.toString());
        workerData.script = scripts[workerData.job];
        const success = await handleWork(io, workerData, workerPool);

        if (success) {
          consumerChannel.ack(message);
          ioEmit(workerData.job, workerData);
        } else {
          consumerChannel.nack(message, true);
          workerData.error = 'A work queue error occurred.';
          ioEmit('error', workerData);
        }
      } catch (error) {
        ioEmit('error', error);
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
