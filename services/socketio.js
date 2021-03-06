const { SOCKET_HOST } = require(__basedir + '/config/constants');
const socketio = require('socket.io');

const connectSocketio = (httpServer, rxStomp) => {
  const io = socketio(httpServer, {
    cors: {
      origin: SOCKET_HOST,
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  io.use((socket, next) => {
    socket.rxStomp = rxStomp;
    next();
  });

  const registerSocketRoutes = require(__basedir + '/routes/socketRoutes');
  const onConnection = socket => registerSocketRoutes(io, socket);
  io.on('connection', onConnection);
  return io;
};

module.exports = connectSocketio;
