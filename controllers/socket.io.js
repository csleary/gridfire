import { SOCKET_HOST } from '../config/constants.js';
import { Server } from 'socket.io';
import registerSocketRoutes from '../routes/socketRoutes.js';

const connect = server => {
  const io = new Server(server, {
    cors: { origin: SOCKET_HOST, methods: ['GET', 'POST'], credentials: true },
    serveClient: false
  });

  const onConnection = socket => registerSocketRoutes(io, socket);
  io.on('connection', onConnection);
  return io;
};

export default connect;
