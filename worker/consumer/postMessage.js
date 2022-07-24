import { publishToQueue } from "gridfire-worker/publisher/index.js";

const postMessage = message => {
  const { userId } = message;
  publishToQueue("user", userId, message);
};

export default postMessage;
