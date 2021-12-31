import { publishToQueue } from '../publisher/index.js';

const { MESSAGE_QUEUE } = process.env;
const postMessage = message => publishToQueue('', MESSAGE_QUEUE, message);

export default postMessage;
