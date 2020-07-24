const { QUEUE_ARTWORK, QUEUE_TRANSCODE, RABBIT_HOST } = require('../../config/constants');
const Pool = require('worker-threads-pool');
const amqp = require('amqplib');
const { rabbitUser, rabbitPass } = require('../../config/keys');
const numCPUs = require('os').cpus().length;
const startConsumer = require('./consumer');
const { startPublisher } = require('./publisher');
const workerPool = new Pool({ max: numCPUs });

module.exports = app => {
  const connectToServer = async () => {
    try {
      const connection = await amqp.connect(`amqp://${rabbitUser}:${rabbitPass}@${RABBIT_HOST}:5672`);

      connection.on('error', error => {
        if (error.message !== 'Connection closing.') {
          console.error('[AMQP] Connection error:\n', error.message);
        }
      });

      connection.on('close', () => {
        console.error('[AMQP] Connection closed. Reconnecting…');
        return setTimeout(connectToServer, 3000);
      });

      const io = app.get('socketio');
      startPublisher(connection);
      for (let i = 0; i < 2; i++) {
        startConsumer({ connection, io, workerPool, queue: QUEUE_ARTWORK });
      }

      for (let i = 0; i < numCPUs; i++) {
        startConsumer({ connection, io, workerPool, queue: QUEUE_TRANSCODE });
      }
    } catch (error) {
      setTimeout(connectToServer, 3000);
    }
  };

  connectToServer();
};
