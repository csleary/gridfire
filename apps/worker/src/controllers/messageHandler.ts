import { BlockRangeMessage, JobMessage, MessageHandler } from "@gridfire/shared/types";
import encodeFLAC from "@gridfire/worker/controllers/encodeFLAC";
import transcodeAAC from "@gridfire/worker/controllers/transcodeAAC";
import transcodeMP3 from "@gridfire/worker/controllers/transcodeMP3";

const isJobMessage = (message: BlockRangeMessage | JobMessage): message is JobMessage => "job" in message;
const jobs: Record<string, (message: JobMessage) => Promise<void>> = { encodeFLAC, transcodeAAC, transcodeMP3 };

const messageHandler: MessageHandler = async (message: BlockRangeMessage | JobMessage) => {
  if (!isJobMessage(message)) {
    throw new Error("Worker message is missing the 'job' property.");
  }

  const { job } = message;
  const work = jobs[job];
  await work(message);
};

export default messageHandler;
