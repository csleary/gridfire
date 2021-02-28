const crypto = require('crypto');
const { fetchXemPrice, fetchXemPriceBinance } = require('../controllers/nemController');
const { distinct, filter } = require('rxjs/operators');
const mongoose = require('mongoose');
const nem = require('nem-sdk').default;
const Release = mongoose.model('releases');
const Sale = mongoose.model('sales');
const User = mongoose.model('users');
const { matchTransaction } = require('../controllers/paymentController');

module.exports = (io, socket, rxStomp) => {
  socket.on('user/subscribe', ({ userId }) => {
    socket.join(userId);
    if (process.env.NODE_ENV === 'development') console.log(`User [${userId}] subscribed to updates.`);
  });

  socket.on('payment/unsubscribe', ({ userId }) => {
    const client = rxStomp.stompClient;
    client.unsubscribe(`${userId}/unconfirmed`);
    client.unsubscribe(`${userId}/transactions`);
    if (process.env.NODE_ENV === 'development') console.log(`User [${userId}] unsubscribed from payments.`);
  });

  socket.on('payment/subscribe', async ({ userId, releaseId }) => {
    try {
      const release = await Release.findById(releaseId, '-__v', { lean: true });
      const xemPriceUsd = await fetchXemPriceBinance().catch(() => fetchXemPrice());
      const priceInXem = release.price / xemPriceUsd;
      const priceInRawXem = Math.ceil(priceInXem * 10 ** 6);
      const owner = await User.findById(release.user, 'nemAddress', { lean: true });
      const customer = await User.findById(userId, 'auth.idHash', { lean: true });
      const customerIdHash = customer.auth.idHash;
      const hash = crypto.createHash('sha256');
      const paymentHash = hash.update(release._id.toString()).update(customerIdHash).digest('hex').substring(0, 24);
      const paymentAddress = owner.nemAddress;
      const paymentInfo = { paymentAddress: nem.utils.format.address(paymentAddress), paymentHash };
      io.to(userId).emit('payment/invoice', { paymentInfo, priceInRawXem, release });

      // Unconfirmed subscription
      rxStomp
        .watch(`/unconfirmed/${paymentAddress}`, { id: `${userId}/unconfirmed` })
        .pipe(
          distinct(data => JSON.parse(data.body).meta.hash.data),
          filter(data => matchTransaction(data, paymentHash))
        )
        .subscribe(data => io.to(userId).emit('payment/unconfirmed', { transaction: JSON.parse(data.body) }));

      // Confirmed subscription
      let amountPaid = 0;
      let transactions = [];

      rxStomp
        .watch(`/transactions/${paymentAddress}`, { id: `${userId}/confirmed` })
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

            await Sale.create({
              purchaseDate: Date.now(),
              release: releaseId,
              amountPaid,
              transactions,
              user: userId,
              userAddress: paymentAddress
            });
          }

          io.to(userId).emit('payment/received', { hasPurchased, transaction: confirmed });
        });
    } catch (error) {
      io.to(userId).emit('payment/error', { error: error.message || error.toString() });
    }
  });
};
