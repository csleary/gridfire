module.exports = io => (message, data) => {
  if (data.clientId) {
    io.to(data.clientId).emit(message, data);
  } else {
    io.emit(message, data);
  }
};
