const closeOnError = (connection, error) => {
  if (!error) return false;
  console.error('[AMQP] Error!\n', error);
  connection.close();
  return true;
};

module.exports = closeOnError;
