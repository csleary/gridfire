import closeOnError from "../closeOnError.js";
import encodeFLAC from "./encodeFLAC.js";
import transcodeAAC from "./transcodeAAC.js";
import transcodeMP3 from "./transcodeMP3.js";
import { create } from "ipfs-http-client";

const { WORKER_QUEUE } = process.env;
const ipfs = create();
const jobs = { encodeFLAC, transcodeAAC, transcodeMP3 };

const startConsumer = async connection => {
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
        console.log(error);
        channel.nack(data, false, false);
      }
    };

    channel.on("error", error => {
      console.error("[AMQP] Channel error:\n", error.message);
    });

    channel.prefetch(1);
    await channel.assertQueue(WORKER_QUEUE, { durable: true });
    channel.consume(WORKER_QUEUE, processMessage, { noAck: false });
  } catch (error) {
    if (closeOnError(connection, error)) return;
  }
};

export { ipfs, startConsumer as default };
