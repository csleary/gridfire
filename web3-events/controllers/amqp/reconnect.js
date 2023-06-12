import logger from "gridfire-web3-events/controllers/logger.js";

let attempt = 1;
let delay = 1000;

const reconnect = async connect => {
  logger.info(`Trying attempt ${++attempt} in ${delay / 1000} second${attempt === 2 ? "" : "s"}…`);
  await new Promise(resolve => setTimeout(resolve, delay));
  delay *= 2;
  return connect();
};

export default reconnect;
