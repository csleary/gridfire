const crypto = require('crypto');
const { fetchXemPrice, fetchXemPriceBinance } = require('../controllers/nemController');
const { distinct, filter } = require('rxjs/operators');
const mongoose = require('mongoose');
const nem = require('nem-sdk').default;
const Release = mongoose.model('releases');
const Sale = mongoose.model('sales');
const User = mongoose.model('users');
const { matchTransaction } = require('../controllers/paymentController');
const devEnv = process.env.NODE_ENV === 'development';

module.exports = (io, socket, rxStomp) => {
  socket.on('user/subscribe', ({ userId }) => {
    socket.join(userId);
    if (devEnv) console.log(`User [${userId}] subscribed to updates.`);
  });

  socket.on('payment/subscribe', async ({ releaseId, userId }) => {
    const socketId = socket.id;

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
      io.to(socketId).emit('payment/invoice', { paymentInfo, priceInRawXem, release });
      const unconfirmedEndpoint = `/unconfirmed/${paymentAddress}`;
      const confirmedEndpoint = `/transactions/${paymentAddress}`;

      // Unconfirmed subscription
      const subUnconfirmed = rxStomp
        .watch(unconfirmedEndpoint, { id: `${socketId}/unconfirmed` })
        .pipe(
          distinct(data => JSON.parse(data.body).meta.hash.data),
          filter(data => matchTransaction(data, paymentHash))
        )
        .subscribe(data => io.to(socketId).emit('payment/unconfirmed', { transaction: JSON.parse(data.body) }));

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

            await Sale.create({
              purchaseDate: Date.now(),
              release: releaseId,
              amountPaid,
              transactions,
              user: userId,
              userAddress: paymentAddress
            });
          }

          io.to(socketId).emit('payment/received', { hasPurchased, transaction: confirmed });
        });

      socket.on('payment/unsubscribe', () => {
        subUnconfirmed.unsubscribe();
        subConfirmed.unsubscribe();
        if (devEnv) console.log(`User [${userId}] unsubscribed from payments.`);
      });
    } catch (error) {
      io.to(socketId).emit('payment/error', { error: error.message || error.toString() });
    }
  });
};
