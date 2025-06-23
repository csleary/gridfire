import { publishToQueue } from "@gridfire/shared/amqp";
import type { ServerSentMessage } from "@gridfire/shared/types/messages";

const postMessage = (message: ServerSentMessage) => {
  const { userId = "" } = message;
  publishToQueue("user", userId, message);
};

export default postMessage;
