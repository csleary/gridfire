import { Channel, Connection } from "amqplib";
import { MessageTuple } from "gridfire-worker/types/index.js";
import closeOnError from "gridfire-worker/controllers/amqp/closeOnError.js";

let channel: Channel | null = null;
const offlineQueue: MessageTuple[] = [];

const publishToQueue = (exchange: string, routingKey: string, message: any) => {
  const data = Buffer.from(JSON.stringify(message));
  try {
    if (channel) {
      channel.publish(exchange, routingKey, data, { persistent: true });
    } else {
      offlineQueue.push([exchange, routingKey, data]);
    }
  } catch (error) {
    offlineQueue.push([exchange, routingKey, data]);
    if (channel) channel.connection.close();
  }
};

const startPublisher = async (connection: Connection) => {
  try {
    channel = await connection.createConfirmChannel();
    channel.on("error", error => console.error("[AMQP] Channel error: ", error.message));

    while (offlineQueue.length) {
      const job = offlineQueue.shift();
      if (!job) break;
      const [exchange, routingKey, data] = job;
      publishToQueue(exchange, routingKey, data);
    }
  } catch (error) {
    if (closeOnError(connection, error)) return;
  }
};

export { startPublisher as default, publishToQueue };
