const { distinct, filter } = require('rxjs/operators');
const { matchTransaction, createInvoice, createSale } = require('../controllers/paymentController');
const nem = require('nem-sdk').default;
const devEnv = process.env.NODE_ENV === 'development';
const { format } = nem.utils;

module.exports = (io, socket) => {
  console.log('Socket.io server running.');
  const { rxStomp } = socket;

  socket.on('user/subscribe', ({ userId }) => {
    socket.join(userId);
    if (devEnv) console.log(`User [${userId}] subscribed to updates.`);
  });

  socket.on('payment/subscribe', async ({ releaseId, userId }) => {
    const operatorUser = io.to(userId);

    try {
      const socketId = socket.id;
      const { paymentAddress, paymentHash, priceInRawXem, release } = await createInvoice(releaseId, userId);
      const paymentInfo = { paymentAddress: format.address(paymentAddress), paymentHash };
      const operatorSocket = io.to(socketId);
      operatorSocket.emit('payment/invoice', { paymentInfo, priceInRawXem, release });
      const unconfirmedEndpoint = `/unconfirmed/${paymentAddress}`;
      const confirmedEndpoint = `/transactions/${paymentAddress}`;

      // Unconfirmed subscription
      const subUnconfirmed = rxStomp
        .watch(unconfirmedEndpoint, { id: `${socketId}/unconfirmed` })
        .pipe(
          distinct(data => JSON.parse(data.body).meta.hash.data),
          filter(data => matchTransaction(data, paymentHash))
        )
        .subscribe(data => operatorSocket.emit('payment/unconfirmed', { transaction: JSON.parse(data.body) }));

      // Confirmed subscription
      let amountPaid = 0;
      let transactions = [];

      const subConfirmed = rxStomp
        .watch(confirmedEndpoint, { id: `${socketId}/confirmed` })
        .pipe(
          distinct(data => JSON.parse(data.body).meta.hash.data),
          filter(data => matchTransaction(data, paymentHash))
        )
        .subscribe(async data => {
          const confirmed = JSON.parse(data.body);
          const { amount, otherTrans, type } = confirmed.transaction;
          amountPaid += type === 257 ? amount : otherTrans.amount;
          transactions = [...transactions, confirmed];
          let hasPurchased = false;

          if (amountPaid >= priceInRawXem) {
            hasPurchased = true;
            await createSale({ amountPaid, paymentAddress, releaseId, transactions, userId });
          }

          operatorSocket.emit('payment/received', { hasPurchased, transaction: confirmed });
        });

      socket.on('payment/unsubscribe', () => {
        subUnconfirmed.unsubscribe();
        subConfirmed.unsubscribe();
        if (devEnv) console.log(`User [${userId}] unsubscribed from payments.`);
      });
    } catch (error) {
      console.log(error);
      operatorUser.emit('payment/error', { error: error.message || error.toString() });
    }
  });
};
