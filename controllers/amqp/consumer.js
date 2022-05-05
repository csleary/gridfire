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
        const { userId, ...rest } = message;
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
    channel.consume(QUEUE_MESSAGE, processMessage, { noAck: false });
  } catch (error) {
    if (closeOnError(connection, error)) return;
  }
};

export default startConsumer;
