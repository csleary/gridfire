import Logger from "@gridfire/shared/logger";
import { ChannelModel, ConfirmChannel } from "amqplib";

let channel: ConfirmChannel;
const logger = new Logger("AMQP");

const publishToQueue = async (exchange: string, routingKey: string, message: any) => {
  const data = Buffer.from(JSON.stringify(message));

  try {
    await new Promise((resolve, reject) => {
      if (!channel) {
        reject(new Error("No AMQP publishing channel available."));
      }

      channel.publish(exchange, routingKey, data, { persistent: true }, error => {
        if (error) reject(error);
        resolve(void 0);
      });
    });
  } catch (error: any) {
    logger.error;
  }
};

const startPublisher = async (connection: ChannelModel) => {
  try {
    channel = await connection.createConfirmChannel();
    channel.assertExchange("user", "direct");
    channel.on("error", error => logger.error("[AMQP] Channel error: ", error.message));
  } catch (error) {
    logger.error(error);
  }
};

export { startPublisher as default, publishToQueue };
