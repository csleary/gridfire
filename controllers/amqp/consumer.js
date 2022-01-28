import closeOnError from "./closeOnError.js";
import { sendEvent } from "../sseController.js";

const { MESSAGE_QUEUE } = process.env;

const startConsumer = async (connection, sseSessions) => {
  try {
    const channel = await connection.createChannel();

    const processMessage = async data => {
      if (data === null) return; // null message fired if consumer was cancelled.

      try {
        const message = JSON.parse(data.content.toString());
        // console.log(`[Worker Message] ${JSON.stringify(message)}`);
        const { userId, ...rest } = message;
        const { res } = sseSessions.get(userId);
        sendEvent(res, rest);
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
    await channel.assertQueue(MESSAGE_QUEUE, { durable: true });
    channel.consume(MESSAGE_QUEUE, processMessage, { noAck: false });
  } catch (error) {
    if (closeOnError(connection, error)) return;
  }
};

export default startConsumer;
