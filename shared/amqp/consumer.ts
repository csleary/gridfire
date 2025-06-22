import Logger from "@gridfire/shared/logger";
import sseClient from "@gridfire/shared/sseController";
import { ChannelModel, ConsumeMessage } from "amqplib";
import assert from "node:assert/strict";

const logger = new Logger("AMQP");
const { INPUT_QUEUES } = process.env;

const startConsumer = async (connection: ChannelModel, consumerTags: string[], messageHandler?: any) => {
  try {
    const channel = await connection.createChannel();

    const onMessage = async (data: ConsumeMessage | null) => {
      if (data === null) return; // null message fired if consumer was cancelled.

      try {
        const message = JSON.parse(data.content.toString());
        const { ping, userId, uuid, ...rest } = message;

        if (ping) {
          sseClient.ping(userId, uuid);
          return void channel.ack(data);
        }

        if (messageHandler) {
          await messageHandler(message);
        }

        sseClient.send(userId, rest);
        channel.ack(data);
      } catch (error: any) {
        logger.error("Error processing message:", error.message ?? error);
        channel.nack(data, false, false);
      }
    };

    channel.on("error", error => {
      logger.error("Channel error:", error.message ?? error);
    });

    channel.prefetch(5);

    if (INPUT_QUEUES) {
      for (let queueName of INPUT_QUEUES.split(",")) {
        queueName = queueName.trim();
        assert(queueName, "QUEUE_NAMES env var is not set correctly.");
        await channel.assertQueue(queueName, { durable: true });
        const config = await channel.consume(queueName, onMessage, { noAck: false });
        const { consumerTag } = config || {};
        consumerTags.push(consumerTag);
      }
    }

    sseClient.setConsumerChannel(channel, onMessage);
    return channel;
  } catch (error: any) {
    logger.error("Consumer error:", error.message ?? error);
  }
};

export default startConsumer;
