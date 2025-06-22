import Logger from "@gridfire/shared/logger";
import { ConnectFunction, MessageHandler } from "@gridfire/shared/types/amqp.js";

const logger = new Logger("AMQP");
let attempt = 1;
let delay = 1000;

const reconnect = async (connect: ConnectFunction, messageHandler?: MessageHandler) => {
  logger.info(`Trying attempt ${++attempt} in ${delay / 1000} second${attempt === 2 ? "" : "s"}…`);
  await new Promise(resolve => setTimeout(resolve, delay));
  delay *= 2;
  return connect({ messageHandler });
};

export default reconnect;
