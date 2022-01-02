import { Server } from 'socket.io';
import registerSocketRoutes from '../routes/socketRoutes.js';

const { SOCKET_HOST } = process.env;

const connect = server => {
  const io = new Server(server, {
    cors: { origin: SOCKET_HOST, methods: ['GET', 'POST'], credentials: true },
    serveClient: false
  });

  const onConnection = socket => registerSocketRoutes(io, socket);
  io.on('connection', onConnection);
  io.on('close', () => console.log('[Socket.io] Closed.'));
  return io;
};

export default connect;
