const { QUEUE_ARTWORK, QUEUE_TRANSCODE } = require('../../config/constants');
const Pool = require('worker-threads-pool');
const amqp = require('amqplib');
const { rabbitUser, rabbitPass } = require('../../config/keys');
const numCPUs = require('os').cpus().length;
const startConsumer = require('./consumer');
const { startPublisher } = require('./publisher');
const workerPool = new Pool({ max: numCPUs });

module.exports = app => {
  let connection;
  const connectToServer = async () => {
    try {
      connection = await amqp.connect(
        `amqp://${rabbitUser}:${rabbitPass}@rabbit:5672`
      );

      connection.on('error', error => {
        if (error.message !== 'Connection closing.') {
          console.error('[AMQP] Connection error:\n', error.message);
        }
      });

      connection.on('close', () => {
        console.error('[AMQP] Connection closed. Reconnecting…');
        return setTimeout(connectToServer, 1000);
      });

      whenConnected();
    } catch (error) {
      setTimeout(connectToServer, 1000);
    }
  };
  const whenConnected = () => {
    const io = app.get('socketio');
    startPublisher(connection);
    startConsumer({ connection, io, workerPool, queue: QUEUE_ARTWORK });

    for (let i = 0; i < numCPUs; i++) {
      startConsumer({ connection, io, workerPool, queue: QUEUE_TRANSCODE });
    }
  };
  connectToServer();
};
