import crypto from 'crypto';
import express from 'express';
import passport from 'passport';
import { getUser } from '../controllers/userController.js';

const router = express.Router();

router.get('/web3', (req, res) => {
  const nonce = crypto.randomBytes(16).toString('hex');
  res.json({ nonce });
});

router.post('/web3', (req, res, next) =>
  passport.authenticate('web3', (authError, user, info) => {
    if (user === false) return res.status(401).json({ error: info });
    if (authError) return res.status(401).json({ error: authError.message });

    req.logIn(user, async logInError => {
      if (logInError) return res.status(400).json({ error: logInError.message });
      const userWithMeta = await getUser(user._id);
      res.json({ user: userWithMeta });
    });
  })(req, res, next)
);

router.get('/logout', (req, res) => {
  req.logout();
  delete req.user;
  res.send({ success: 'Thanks for visiting. You are now logged out.' });
});

export default router;
