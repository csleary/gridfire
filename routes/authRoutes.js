const { GOOGLE_REDIRECT, SPOTIFY_REDIRECT, TWITTER_REDIRECT } = require('../config/constants');
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

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', passport.authenticate('google'), (req, res) => res.redirect(GOOGLE_REDIRECT));
router.get('/spotify', passport.authenticate('spotify', { scope: ['user-read-email'] }));
router.get('/spotify/callback', passport.authenticate('spotify'), (req, res) => res.redirect(SPOTIFY_REDIRECT));
router.get('/twitter', passport.authenticate('twitter'));
router.get('/twitter/callback', passport.authenticate('twitter'), (req, res) => res.redirect(TWITTER_REDIRECT));

router.get('/logout', (req, res) => {
  req.logout();
  delete req.user;
  res.send({ success: 'Thanks for visiting. You are now logged out.' });
});

module.exports = router;
