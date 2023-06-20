import { Connection } from "amqplib";
import logger from "gridfire-web3-events/controllers/logger.js";

const closeOnError = (connection: Connection, error: any) => {
  if (!error) return false;
  logger.error(`AMQP Error! ${error.message}`);
  connection.close();
  return true;
};

export default closeOnError;
