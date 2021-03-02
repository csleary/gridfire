const { SOCKET_HOST } = require(__basedir + '/config/constants');
const socketio = require('socket.io');

const connectSocketio = async (httpServer, rxStomp) => {
  const io = socketio(httpServer, {
    cors: {
      origin: SOCKET_HOST,
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  const registerSocketRoutes = require(__basedir + '/routes/socketRoutes');
  const onConnection = async socket => registerSocketRoutes(io, socket, rxStomp);
  io.on('connection', onConnection);
  return io;
};

module.exports = connectSocketio;
