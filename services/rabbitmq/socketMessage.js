export default io =>
  (message, { userId, ...rest }) => {
    const operatorUser = io.to(userId);
    operatorUser.emit(message, { ...rest });
  };
