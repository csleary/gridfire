import { publishToQueue } from "gridfire-worker/publisher/index.js";
import { ServerSentMessage } from "gridfire-worker/types/messages/index.js";

const postMessage = (message: ServerSentMessage) => {
  const { userId } = message;
  publishToQueue("user", userId, message);
};

export default postMessage;
