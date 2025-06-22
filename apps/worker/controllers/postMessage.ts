import { publishToQueue } from "@gridfire/shared/amqp/publisher.js";
import type { ServerSentMessage } from "@gridfire/shared/types/messages.js";

const postMessage = (message: ServerSentMessage) => {
  const { userId = "" } = message;
  publishToQueue("user", userId, message);
};

export default postMessage;
