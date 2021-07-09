import closeOnError from './closeOnError.js';
import handleWork from './worker.js';
import path from 'path';

const scriptsPath = path.resolve('services', 'rabbitmq', 'workerScripts');

const scripts = {
  encodeFLAC: path.resolve(scriptsPath, 'encodeFLAC.js'),
  transcodeAAC: path.resolve(scriptsPath, 'transcodeAAC.js'),
  transcodeMP3: path.resolve(scriptsPath, 'transcodeMP3.js'),
  sendCredits: path.resolve(scriptsPath, 'sendCredits.js')
};

const startConsumer = async ({ connection, io, workerPool, queue }) => {
  try {
    const consumerChannel = await connection.createChannel();

    const processMessage = async message => {
      if (message === null) return; // null message fired if consumer was cancelled.

      try {
        const workerData = JSON.parse(message.content.toString());
        const workerScript = scripts[workerData.job];
        if (!workerScript) return consumerChannel.nack(message, false, false);
        const success = await handleWork(io, workerPool, workerData, workerScript);

        if (success) {
          consumerChannel.ack(message);
        } else {
          consumerChannel.nack(message, false, false);
        }
      } catch (error) {
        consumerChannel.nack(message, false, false);
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

export default startConsumer;
