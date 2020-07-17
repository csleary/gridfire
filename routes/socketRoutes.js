module.exports = app => {
  const io = app.get('socketio');

  io.on('connection', socket => {
    socket.on('subscribeUser', ({ userId }) => {
      socket.join(userId);
      if (process.env.NODE_ENV === 'development') console.log(`User [${userId}] subscribed to updates.`);
    });
  });
};
