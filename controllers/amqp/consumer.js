import closeOnError from './closeOnError.js';

const { MESSAGE_QUEUE } = process.env;

const startConsumer = async (connection, io) => {
  try {
    const channel = await connection.createChannel();

    const processMessage = async data => {
      if (data === null) return; // null message fired if consumer was cancelled.

      try {
        const message = JSON.parse(data.content.toString());
        const { type, userId, ...rest } = message;
        const operatorUser = io.to(userId);
        if (type) operatorUser.emit(type, { ...rest });
        else operatorUser.emit('workerMessage', message);
        channel.ack(data);
      } catch (error) {
        channel.nack(data, false, false);
      }
    };

    channel.on('close', () => {});

    channel.on('error', error => {
      console.error('[AMQP] Channel error:\n', error.message);
    });

    channel.prefetch(5);
    await channel.assertQueue(MESSAGE_QUEUE, { durable: true });
    channel.consume(MESSAGE_QUEUE, processMessage, { noAck: false });
  } catch (error) {
    if (closeOnError(connection, error)) return;
  }
};

export default startConsumer;
