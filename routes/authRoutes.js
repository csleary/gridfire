const passport = require('passport');

module.exports = app => {
  app.post(
    '/auth/login',
    passport.authenticate('local-login', {
      successRedirect: '/auth/success',
      failureRedirect: '/auth/failure'
    })
  );

  app.post(
    '/auth/register',
    passport.authenticate('local-register', {
      successRedirect: '/auth/success',
      failureRedirect: '/auth/failure'
    })
  );

  app.post(
    '/auth/update',
    passport.authenticate('local-update', {
      successRedirect: '/auth/success',
      failureRedirect: '/auth/failure',
      failureFlash: true
    })
  );

  app.get('/auth/success', (req, res) => {
    res.send({ success: req.flash('success')[0] });
  });

  app.get('/auth/failure', (req, res) => {
    res.status(401).send({ error: req.flash('error')[0] });
  });

  app.get(
    '/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
  );

  app.get(
    '/auth/google/callback',
    passport.authenticate('google'),
    (req, res) => {
      res.redirect('/');
    }
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
