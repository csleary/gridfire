const passport = require('passport');
const { GOOGLE_REDIRECT } = require('./constants');

module.exports = app => {
  app.post('/api/auth/login', (req, res, next) => {
    passport.authenticate('local-login', (error, user, info) => {
      try {
        if (error) {
          throw new Error(error.message);
        }

        if (!user) {
          res.status(401).send({ error: info });
        }

        req.logIn(user, logInError => {
          if (logInError) {
            throw new Error(`Login error: ${logInError.message}`);
          }

          res.send({ success: 'Thank you. You are now logged in.' });
        });
      } catch (e) {
        res.status(500).send({ error: e.message });
      }
    })(req, res, next);
  });

  app.post('/api/auth/register', (req, res, next) => {
    passport.authenticate('local-register', (error, user, info) => {
      try {
        if (error) {
          throw new Error(error.message);
        }

        if (!user) {
          res.status(401).send({ error: info });
        }

        req.logIn(user, logInError => {
          if (logInError) {
            throw new Error(`Login error: ${logInError.message}`);
          }

          res.send({
            success: 'Thank you for registering. You are now logged in.'
          });
        });
      } catch (e) {
        res.status(500).send({ error: e.message });
      }
    })(req, res, next);
  });

  app.post('/api/auth/update', (req, res, next) => {
    passport.authenticate('local-update', (error, user, info) => {
      try {
        if (error) {
          throw new Error(error.message);
        }

        if (!user) {
          res.status(401).send({ error: info });
        }

        req.logIn(user, logInError => {
          if (logInError) {
            throw new Error(`Login error: ${logInError.message}`);
          }

          res.send({
            success: 'Thank you. Password updated successfully!'
          });
        });
      } catch (e) {
        res.status(500).send({ error: e.message });
      }
    })(req, res, next);
  });

  app.get(
    '/api/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
  );

  app.get(
    '/api/auth/google/callback',
    passport.authenticate('google'),
    (req, res) => res.redirect(GOOGLE_REDIRECT)
  );

  app.get('/api/auth/logout', (req, res) => {
    req.logout();
    delete req.user;
    res.send({ success: 'Thanks for visiting. You are now logged out.' });
  });

  app.get('/api/user', (req, res) => {
    res.send(req.user);
  });
};
