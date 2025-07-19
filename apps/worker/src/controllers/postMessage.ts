import type { UserServerSentMessage } from "@gridfire/shared/types";

import { publishToQueue } from "@gridfire/shared/amqp";

const postMessage = (message: UserServerSentMessage) => {
  const { userId = "" } = message;
  publishToQueue("user", userId, message);
};

export default postMessage;
