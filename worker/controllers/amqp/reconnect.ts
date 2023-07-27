import logger from "gridfire-worker/controllers/logger.js";

let attempt = 1;
let delay = 1000;

const reconnect = async (connect: () => Promise<void>) => {
  logger.info(`Trying attempt ${++attempt} in ${delay / 1000} second${attempt === 2 ? "" : "s"}…`);
  await new Promise(resolve => setTimeout(resolve, delay));
  delay *= 2;
  return connect();
};

export default reconnect;
