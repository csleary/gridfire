import { Connection, ConsumeMessage } from "amqplib";
import closeOnError from "./closeOnError.js";
import sseClient from "gridfire/controllers/sseController.js";
import assert from "assert/strict";

const { QUEUE_MESSAGE } = process.env;

assert(QUEUE_MESSAGE, "QUEUE_MESSAGE env var missing.");

const startConsumer = async (connection: Connection, consumerTags: string[]) => {
  try {
    const channel = await connection.createChannel();

    const processMessage = async (data: ConsumeMessage | null) => {
      if (data === null) return; // null message fired if consumer was cancelled.

      try {
        const message = JSON.parse(data.content.toString());
        const { userId, ping, uuid, ...rest } = message;

        if (ping) {
          sseClient.ping(userId, uuid);
          return void channel.ack(data);
        }

        sseClient.send(userId, rest);
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
    consumerTags.push(consumerTag);
    sseClient.setConsumerChannel(channel, processMessage);
    return channel;
  } catch (error) {
    if (closeOnError(connection, error)) return;
  }
};

export default startConsumer;
