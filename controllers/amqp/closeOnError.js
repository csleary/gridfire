import logger from "gridfire/controllers/logger.js";

const closeOnError = (connection, error) => {
  if (!error) return false;
  logger.error(`AMQP Error! ${error.message}`);
  connection.close();
  return true;
};

export default closeOnError;
