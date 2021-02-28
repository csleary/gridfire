const nem = require('nem-sdk').default;
const { hexMessage } = nem.utils.format;

const matchTransaction = (data, paymentHash) => {
  const parsedMessage = JSON.parse(data.body);
  const { transaction } = parsedMessage;
  const { message, otherTrans, type } = transaction;
  let decodedMessage;
  if (type === 257) decodedMessage = hexMessage(message);
  if (type === 4100 && otherTrans.type === 257) decodedMessage = hexMessage(otherTrans.message);
  return decodedMessage === paymentHash;
};

module.exports = { matchTransaction };
