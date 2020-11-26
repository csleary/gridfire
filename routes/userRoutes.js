const {
  creditPricing,
  creditPurchase,
  creditConfirmation,
  getUser,
  getUserCredits,
  getUserTransactions,
  setUserNemAddress
} = require(__basedir + '/controllers/userController');

const { generateToken, verifyToken } = require(__basedir + '/controllers/tokenController');
const { PAYMENT_ADDRESS } = require(__basedir + '/config/constants');
const requireLogin = require(__basedir + '/middlewares/requireLogin');

module.exports = app => {
  app.get('/api/user', async (req, res) => {
    if (!req.user) return res.end();
    const user = await getUser(req.user._id);
    res.send(user);
  });

  app.post('/api/user/transactions', requireLogin, async (req, res) => {
    try {
      const { releaseId, paymentHash } = req.body;
      const { price } = req.session;
      const transations = await getUserTransactions({ user: req.user, releaseId, paymentHash, price });
      res.send(transations);
    } catch (error) {
      if (error.data) return res.status(500).send({ error: error.data.message });
      res.status(500).send({ error: error.message });
    }
  });

  app.post('/api/user/address', requireLogin, async (req, res) => {
    try {
      const { nemAddress = '', nemAddressChallenge, signedMessage } = req.body;
      const user = await setUserNemAddress({ userId: req.user._id, nemAddress, nemAddressChallenge, signedMessage });
      res.send(user);
    } catch (error) {
      res.status(500).send({ error: error.message });
    }
  });

  app.get('/api/user/credits', requireLogin, async (req, res) => {
    try {
      const credits = await getUserCredits(req.user._id);
      if (!credits) return res.end();
      res.send(credits);
    } catch (error) {
      res.status(500).send({ error: error.message });
    }
  });

  app.get('/api/user/credits/purchase', requireLogin, async (req, res) => {
    try {
      const creditPricingData = await creditPricing();
      const creditPricingToken = generateToken({ creditPricingData });

      res.cookie('creditPricing', creditPricingToken, {
        httpOnly: true,
        maxAge: 1000 * 60 * 10,
        SameSite: true,
        secure: process.env.NODE_ENV === 'production',
        signed: true
      });

      res.send(creditPricingData);
    } catch (error) {
      res.status(500).send({ error: error.message });
    }
  });

  app.post('/api/user/credits/purchase', requireLogin, async (req, res) => {
    try {
      const { sku } = req.body;
      const creditPricingToken = req.signedCookies.creditPricing;
      const { creditPricingData } = verifyToken(creditPricingToken);

      const { nonce, paymentId, priceRawXem, priceXem } = await creditPurchase({
        userId: req.user._id,
        sku,
        creditPricingData
      });

      const creditSessionData = { nonce, paymentId, priceRawXem };
      const creditSessionToken = generateToken(creditSessionData);

      res.cookie('creditSession', creditSessionToken, {
        httpOnly: true,
        maxAge: 1000 * 60 * 10,
        SameSite: true,
        secure: process.env.NODE_ENV === 'production',
        signed: true
      });

      res.send({ nonce, PAYMENT_ADDRESS, paymentId, priceXem });
    } catch (error) {
      res.status(401).send({ error: 'We could not create your purchase.' });
    }
  });

  app.post('/api/user/credits/confirm', requireLogin, async (req, res) => {
    try {
      const { clientId, cnonce } = req.body;
      const creditSessionToken = req.signedCookies.creditSession;
      const { nonce, paymentId } = verifyToken(creditSessionToken);
      const userId = req.user._id;
      const paymentDetails = await creditConfirmation({ userId, clientId, cnonce, nonce, paymentId });
      res.send(paymentDetails);
    } catch (error) {
      res.status(401).send({ error: error.message });
    }
  });
};
