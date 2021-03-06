const { QUEUE_ARTWORK, QUEUE_CREDITS, QUEUE_TRANSCODE, RABBIT_HOST } = require('../../config/constants');
const Pool = require('worker-threads-pool');
const amqp = require('amqplib');
const { rabbitUser, rabbitPass } = require('../../config/keys');
const numCPUs = require('os').cpus().length;
const startConsumer = require('./consumer');
const { startPublisher } = require('./publisher');
const workerPool = new Pool({ max: numCPUs });

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

module.exports = connect;
