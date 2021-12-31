import mongoose from 'mongoose';
import amqp from 'amqplib';
import startConsumer from './consumer/index.js';
import startPublisher from './publisher/index.js';
import './models/Release.js';

const { MONGO_URI, RABBITMQ_USER, RABBIT_HOST, RABBITMQ_PASS } = process.env;

const db = mongoose.connection;
db.once('open', () => console.log('[Worker] [Mongoose] Connected.'));
db.on('error', console.error);

db.on('disconnected', () => {
  console.error('[Worker] [Mongoose] Connection error. Attempting to reconnect in 5 seconds…');
  setTimeout(mongoose.connect, 5000, MONGO_URI);
});

const amqpConnect = async () => {
  try {
    const url = `amqp://${RABBITMQ_USER}:${RABBITMQ_PASS}@${RABBIT_HOST}:5672`;
    const connection = await amqp.connect(url);
    console.log('[Worker] [AMQP] Connected.');
    connection.on('error', error => console.error('[AMQP] ', error.message));

    connection.on('close', () => {
      console.error('[Worker] [AMQP] Connection closed. Reconnecting…');
      return setTimeout(connect, 3000);
    });

    startPublisher(connection);
    startConsumer(connection);
  } catch (error) {
    setTimeout(amqpConnect, 3000);
  }
};

await mongoose.connect(MONGO_URI).catch(console.error);
await amqpConnect().catch(console.error);
