import { publishToQueue } from '../publisher/index.js';

const { QUEUE_MESSAGE } = process.env;
const postMessage = message => publishToQueue('', QUEUE_MESSAGE, message);

export default postMessage;
