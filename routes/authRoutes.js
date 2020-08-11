const passport = require('passport');
const { GOOGLE_REDIRECT, SPOTIFY_REDIRECT, TWITTER_REDIRECT } = require('../config/constants');
const requireLogin = require('../middlewares/requireLogin');

module.exports = app => {
  app.post('/api/auth/login', (req, res, next) =>
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

  app.post('/api/auth/register', (req, res, next) =>
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

  app.post('/api/auth/update', requireLogin, (req, res, next) =>
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

  app.get('/api/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
  app.get('/api/auth/google/callback', passport.authenticate('google'), (req, res) => res.redirect(GOOGLE_REDIRECT));
  app.get('/api/auth/spotify', passport.authenticate('spotify', { scope: ['user-read-email'] }));
  app.get('/api/auth/spotify/callback', passport.authenticate('spotify'), (req, res) => res.redirect(SPOTIFY_REDIRECT));
  app.get('/api/auth/twitter', passport.authenticate('twitter'));
  app.get('/api/auth/twitter/callback', passport.authenticate('twitter'), (req, res) => res.redirect(TWITTER_REDIRECT));

  app.get('/api/auth/logout', (req, res) => {
    req.logout();
    delete req.user;
    res.send({ success: 'Thanks for visiting. You are now logged out.' });
  });

  app.get('/api/user', (req, res) => {
    res.send(req.user);
  });
};
