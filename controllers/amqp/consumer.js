import closeOnError from "./closeOnError.js";

const { QUEUE_MESSAGE } = process.env;

const startConsumer = async (connection, sse) => {
  try {
    const channel = await connection.createChannel();

    const processMessage = async data => {
      if (data === null) return; // null message fired if consumer was cancelled.

      try {
        const message = JSON.parse(data.content.toString());
        // console.log(`[Worker Message] ${JSON.stringify(message)}`);
        const { userId, ping, uuid, ...rest } = message;

        if (ping) {
          sse.ping(userId, uuid);
          return void channel.ack(data);
        }

        sse.send(userId, rest);
        channel.ack(data);
      } catch (error) {
        channel.nack(data, false, false);
      }
    };

    channel.on("close", () => {});

    channel.on("error", error => {
      console.error("[AMQP] Channel error:\n", error.message);
    });

    channel.prefetch(5);
    await channel.assertQueue(QUEUE_MESSAGE, { durable: true });
    const config = await channel.consume(QUEUE_MESSAGE, processMessage, { noAck: false });
    const { consumerTag } = config || {};
    sse.setConsumerChannel(channel, processMessage);
    return { channel, consumerTag };
  } catch (error) {
    if (closeOnError(connection, error)) return;
  }
};

export default startConsumer;
