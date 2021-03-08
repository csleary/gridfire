const { GOOGLE_REDIRECT, SPOTIFY_REDIRECT, TWITTER_REDIRECT } = require('../config/constants');
const crypto = require('crypto');
const express = require('express');
const passport = require('passport');
const requireLogin = require('../middlewares/requireLogin');
const router = express.Router();

router.post('/login', (req, res, next) =>
  passport.authenticate('local-login', (authError, user, info) => {
    try {
      if (authError) throw new Error(authError.message);
      if (!user) return res.status(401).send({ error: info });

      req.logIn(user, logInError => {
        if (logInError) throw new Error(`Login error: ${logInError.message}`);
        res.send({ success: 'Thank you. You are now logged in.' });
      });
    } catch (error) {
      res.status(500).send({ error: error.message });
    }
  })(req, res, next)
);

router.post('/register', (req, res, next) =>
  passport.authenticate('local-register', (authError, user, info) => {
    try {
      if (authError) throw new Error(authError.message);
      if (!user) return res.status(401).send({ error: info });

      req.logIn(user, logInError => {
        if (logInError) throw new Error(`Login error: ${logInError.message}`);
        res.send({ success: 'Thank you for registering. You are now logged in.' });
      });
    } catch (error) {
      res.status(500).send({ error: error.message });
    }
  })(req, res, next)
);

router.post('/update', requireLogin, (req, res, next) =>
  passport.authenticate('local-update', (authError, user, info) => {
    try {
      if (authError) throw new Error(authError.message);
      if (!user) return res.status(401).send({ error: info });

      req.logIn(user, logInError => {
        if (logInError) throw new Error(`Login error: ${logInError.message}`);
        res.send({ success: 'Thank you. Password updated successfully!' });
      });
    } catch (error) {
      res.status(500).send({ error: error.message });
    }
  })(req, res, next)
);

const generateRedirectKey = () => crypto.randomBytes(16).toString('hex');

router.get('/google', (req, res, next) => {
  const redirectKey = generateRedirectKey();
  req.session[redirectKey] = req.query.prev;
  passport.authenticate('google', { scope: ['profile', 'email'], state: redirectKey })(req, res, next);
});

router.get('/google/callback', passport.authenticate('google'), (req, res) => {
  const redirectKey = req.query.state;
  const prev = req.session[redirectKey];
  delete req.session[redirectKey];
  if (prev === 'undefined') return res.redirect(GOOGLE_REDIRECT);
  return res.redirect(`${GOOGLE_REDIRECT}?prev=${prev}`);
});

router.get('/spotify', (req, res, next) => {
  const redirectKey = generateRedirectKey();
  req.session[redirectKey] = req.query.prev;
  passport.authenticate('spotify', { scope: ['user-read-email'], state: redirectKey })(req, res, next);
});

router.get('/spotify/callback', passport.authenticate('spotify'), (req, res) => {
  const redirectKey = req.query.state;
  const prev = req.session[redirectKey];
  delete req.session[redirectKey];
  if (prev === 'undefined') return res.redirect(SPOTIFY_REDIRECT);
  return res.redirect(`${SPOTIFY_REDIRECT}?prev=${prev}`);
});

router.get('/twitter', passport.authenticate('twitter'));
router.get('/twitter/callback', passport.authenticate('twitter'), (req, res) => res.redirect(TWITTER_REDIRECT));

router.get('/logout', (req, res) => {
  req.logout();
  delete req.user;
  res.send({ success: 'Thanks for visiting. You are now logged out.' });
});

module.exports = router;
