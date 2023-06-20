import { Notification } from "gridfire-web3-events/types/index.js";
import { publishToQueue } from "gridfire-web3-events/controllers/amqp/index.js";

const notifyUser = async (userId: string, payload: Notification) => {
  if (!userId) {
    throw new Error("No userId provided.");
  }

  if (payload != null && typeof payload === "object" && Array.isArray(payload) === false) {
    publishToQueue("user", userId.toString(), payload);
  } else {
    throw new Error("Payload must be an object.");
  }
};

export { notifyUser };
