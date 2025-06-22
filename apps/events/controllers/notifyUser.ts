import { publishToQueue } from "@gridfire/shared/amqp";
import { Notification } from "@gridfire/shared/types/index.js";

const notifyUser = async (userId: string, payload: Notification) => {
  if (!userId) {
    throw new Error("No userId provided.");
  }

  if (payload != null && typeof payload === "object" && Array.isArray(payload) === false) {
    await publishToQueue("user", userId.toString(), payload);
  } else {
    throw new Error("Payload must be an object.");
  }
};

export { notifyUser };
