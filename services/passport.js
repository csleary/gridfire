const crypto = require('crypto');
const keys = require('../config/keys');
const mongoose = require('mongoose');
const passport = require('passport');
const request = require('request');
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = mongoose.model('users');
const { GOOGLE_CALLBACK } = require('../config/constants');

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id, '-__v -auth.password', { lean: true }).exec();
  done(null, user);
});

const idHash = emailAddress => {
  const hash = crypto.createHash('sha256');
  return hash.update(emailAddress).update(keys.nemp3Secret).digest('hex').substring(0, 31);
};

passport.use(
  'local-login',
  new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
    try {
      const user = await User.findOne({ 'auth.email': email }, '-__v').exec();
      if (!user) return done(null, false, 'Login details incorrect.');
      const isMatched = await user.comparePassword(password);
      if (!isMatched) return done(null, false, 'Login details incorrect.');
      user.auth.lastLogin = Date.now();
      const userUpdate = await user.save();
      done(null, userUpdate);
    } catch (error) {
      return done(error);
    }
  })
);

passport.use(
  'local-register',
  new LocalStrategy({ usernameField: 'email', passReqToCallback: true }, async (req, email, password, done) => {
    try {
      request.post(
        'https://www.google.com/recaptcha/api/siteverify',
        { form: { secret: keys.recaptchaSecretKey, response: req.body.recaptcha } },
        async (error, response, body) => {
          if (!JSON.parse(body).success) return done(null, false, body['error-codes']);
          const user = await User.findOne({ 'auth.email': email }).exec();
          if (user) return done(null, false, 'Email already in use.');

          const newUser = await User.create({
            auth: {
              email,
              idHash: idHash(email),
              isLocal: true,
              lastLogin: Date.now(),
              password
            }
          });

          done(null, newUser);
        }
      );
    } catch (error) {
      return done(error);
    }
  })
);

passport.use(
  'local-update',
  new LocalStrategy({ usernameField: 'email', passReqToCallback: true }, async (req, email, password, done) => {
    try {
      const user = await User.findOne({ 'auth.email': email }).exec();
      if (!user) return done(null, false, 'Incorrect username.');
      const isMatched = await user.comparePassword(password);
      if (!isMatched) return done(null, false, 'Incorrect password.');

      if (req.body.passwordNew !== req.body.passwordConfirm) {
        return done(null, false, 'Passwords do not match.');
      }

      user.auth.password = req.body.passwordNew;
      await user.save();
      done(null, user);
    } catch (error) {
      return done(error);
    }
  })
);

passport.use(
  new GoogleStrategy(
    {
      clientID: keys.googleClientId,
      clientSecret: keys.googleClientSecret,
      callbackURL: GOOGLE_CALLBACK,
      proxy: true
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const existingUser = await User.findOne({ 'auth.googleId': profile.id }).exec();

        if (existingUser) {
          existingUser.updateOne({ 'auth.lastLogin': Date.now() }).exec();
          return done(null, existingUser);
        }

        const user = await User.create({
          auth: {
            googleId: profile.id,
            email: profile.emails[0].value,
            idHash: idHash(profile.emails[0].value),
            isLocal: false,
            lastLogin: Date.now()
          }
        });

        done(null, user);
      } catch (err) {
        done(err);
      }
    }
  )
);
