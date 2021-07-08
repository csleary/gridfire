import { QUEUE_ARTWORK, QUEUE_CREDITS, QUEUE_TRANSCODE, RABBIT_HOST } from '../../config/constants.js';
import { rabbitUser, rabbitPass } from '../../config/keys.js';
import Pool from 'worker-threads-pool';
import amqp from 'amqplib';
import os from 'os';
import startConsumer from './consumer.js';
import { startPublisher } from './publisher.js';
const workerPool = new Pool({ max: os.cpus().length });

const connect = async io => {
  try {
    const connection = await amqp.connect(`amqp://${rabbitUser}:${rabbitPass}@${RABBIT_HOST}:5672`);

    connection.on('error', error => {
      if (error.message !== 'Connection closing.') {
        console.error('[AMQP] Connection error:\n', error.message);
      }
    });

    connection.on('close', () => {
      console.error('[AMQP] Connection closed. Reconnecting…');
      return setTimeout(connect, 3000);
    });

    startPublisher(connection);
    startConsumer({ connection, io, workerPool, queue: QUEUE_ARTWORK });
    startConsumer({ connection, io, workerPool, queue: QUEUE_TRANSCODE });
    startConsumer({ connection, io, workerPool, queue: QUEUE_CREDITS });
  } catch (error) {
    setTimeout(connect, 3000);
  }
};

export default connect;
