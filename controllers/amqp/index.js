import { RABBIT_HOST } from '../../config/constants.js';
import { rabbitUser, rabbitPass } from '../../config/keys.js';
import amqp from 'amqplib';
import startConsumer from './consumer.js';
import startPublisher from './publisher.js';

const connect = async io => {
  try {
    const url = `amqp://${rabbitUser}:${rabbitPass}@${RABBIT_HOST}:5672`;
    const connection = await amqp.connect(url);
    console.log('[AMQP] Connected.');
    connection.on('error', error => console.error('[AMQP] ', error.message));

    connection.on('close', () => {
      console.error('[AMQP] Connection closed. Reconnecting…');
      return setTimeout(connect, 3000);
    });

    startPublisher(connection);
    startConsumer(connection, io);
  } catch (error) {
    console.log(error);
    setTimeout(connect, 3000);
  }
};

export default connect;
