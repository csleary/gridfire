import { Connection } from "amqplib";

const closeOnError = (connection: Connection, error: any) => {
  if (!error) return false;
  console.error("[AMQP] Error!\n", error);
  connection.close();
  return true;
};

export default closeOnError;
