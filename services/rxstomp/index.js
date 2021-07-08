import { RxStomp } from '@stomp/rx-stomp';
import { findNode } from '../../controllers/nemController.js';

const connectStomp = async () => {
  const { host: nis } = await findNode();
  const rxStomp = new RxStomp();

  rxStomp.configure({
    brokerURL: `ws://${nis}:7778/w/messages/websocket`,
    debug: str => process.env.NODE_ENV === 'development' && console.log('STOMP: ' + str),
    reconnectDelay: 1000
  });

  rxStomp.activate();
  if (process.env.NODE_ENV === 'development') console.log('Stomp using NIS node: %s', nis);
  return rxStomp;
};

export default connectStomp;
