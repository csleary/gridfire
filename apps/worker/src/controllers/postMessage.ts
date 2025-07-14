import type { ServerSentMessage } from "@gridfire/shared/types";

import { publishToQueue } from "@gridfire/shared/amqp";

const postMessage = (message: ServerSentMessage) => {
  const { userId = "" } = message;
  publishToQueue("user", userId, message);
};

export default postMessage;
