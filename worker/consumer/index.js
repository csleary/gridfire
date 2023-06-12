import { strict as assert } from "assert/strict";
import closeOnError from "gridfire-worker/closeOnError.js";
import { create } from "ipfs-http-client";
import encodeFLAC from "gridfire-worker/consumer/encodeFLAC.js";
import transcodeAAC from "gridfire-worker/consumer/transcodeAAC.js";
import transcodeMP3 from "gridfire-worker/consumer/transcodeMP3.js";

const { IPFS_NODE_HOST, QUEUE_TRANSCODE } = process.env;
const ipfs = create(IPFS_NODE_HOST);
const jobs = { encodeFLAC, transcodeAAC, transcodeMP3 };
assert(QUEUE_TRANSCODE, "QUEUE_TRANSCODE is not set.");

const startConsumer = async (connection, consumerTags) => {
  try {
    const channel = await connection.createChannel();

    const processMessage = async data => {
      if (data === null) return; // null message fired if consumer was cancelled.

      try {
        const { job, ...message } = JSON.parse(data.content.toString());
        const work = jobs[job];
        await work(message);
        channel.ack(data);
      } catch (error) {
        channel.nack(data, false, false);
      }
    };

    channel.on("error", error => {
      console.error("[AMQP] Channel error:\n", error.message);
    });

    channel.prefetch(1);
    await channel.assertQueue(QUEUE_TRANSCODE, { durable: true });
    const config = await channel.consume(QUEUE_TRANSCODE, processMessage, { noAck: false });
    const { consumerTag } = config || {};
    consumerTags.push(consumerTag);
    return channel;
  } catch (error) {
    if (closeOnError(connection, error)) return;
  }
};

export { ipfs, startConsumer as default };
