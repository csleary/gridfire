module.exports = io => (message, { userId, ...rest }) => {
  const operatorUser = io.to(userId);
  operatorUser.emit(message, { ...rest });
};
