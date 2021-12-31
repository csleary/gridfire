const isDev = process.env.NODE_ENV === 'development';

export default (io, socket) => {
  console.log('[Socket.io] Server running.');

  socket.on('user/subscribe', ({ userId }) => {
    socket.join(userId);
    if (isDev) console.log(`[Socket.io] User [${userId}] subscribed to updates.`);
  });
};
