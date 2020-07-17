module.exports = io => (message, { userId, ...rest }) => {
  io.to(userId).emit(message, { ...rest });
};
