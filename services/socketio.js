import { SOCKET_HOST } from '../config/constants.js';
import { Server } from 'socket.io';
import registerSocketRoutes from '../routes/socketRoutes.js';

const connectSocketio = (httpServer, rxStomp) => {
  const io = new Server(httpServer, {
    cors: {
      origin: SOCKET_HOST,
      methods: ['GET', 'POST'],
      credentials: true
    },
    serveClient: false
  });

  io.use((socket, next) => {
    socket.rxStomp = rxStomp;
    next();
  });

  const onConnection = socket => registerSocketRoutes(io, socket);
  io.on('connection', onConnection);
  return io;
};

export default connectSocketio;
