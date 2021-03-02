const { RxStomp } = require('@stomp/rx-stomp');
const { findNode } = require(__basedir + '/controllers/nemController');

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

module.exports = connectStomp;
