import { MessageHandler } from "@gridfire/shared/types/amqp";
import encodeFLAC from "@gridfire/worker/controllers/encodeFLAC";
import transcodeAAC from "@gridfire/worker/controllers/transcodeAAC";
import transcodeMP3 from "@gridfire/worker/controllers/transcodeMP3";

const jobs: Record<string, (message: any) => Promise<void>> = { encodeFLAC, transcodeAAC, transcodeMP3 };

const messageHandler: MessageHandler = async message => {
  const { job } = message;
  const work = jobs[job];
  await work(message);
};

export default messageHandler;
