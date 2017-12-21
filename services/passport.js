const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const LocalStrategy = require('passport-local').Strategy;
const mongoose = require('mongoose');
const SHA256 = require('crypto-js/sha256');
const keys = require('../config/keys');

const User = mongoose.model('users');

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id);
  done(null, user);
});

function idHash(emailAddress) {
  const hash = SHA256(emailAddress + keys.nemp3Secret)
    .toString()
    .substring(0, 31);
  return hash;
}

passport.use(
  'local-login',
  new LocalStrategy(
    {
      usernameField: 'email',
      passReqToCallback: true
    },
    async (req, email, password, done) => {
      try {
        const existingUser = await User.findOne({ 'auth.email': email });
        if (!existingUser) return done(null, false);
        const isMatched = await existingUser.comparePassword(password);
        if (!isMatched) return done(null, false);
        done(null, existingUser);
      } catch (err) {
        return done(err);
      }
    }
  )
);

passport.use(
  'local-register',
  new LocalStrategy(
    {
      usernameField: 'email',
      passReqToCallback: true
    },
    async (req, email, password, done) => {
      try {
        const user = await User.findOne({ 'auth.email': email });

        if (user) {
          return done(null, false);
        }

        const newUser = await new User({
          auth: {
            email,
            idHash: idHash(email),
            password
          }
        }).save();

        done(null, newUser);
      } catch (err) {
        done(err);
      }
    }
  )
);

passport.use(
  new GoogleStrategy(
    {
      clientID: keys.googleClientId,
      clientSecret: keys.googleClientSecret,
      callbackURL: '/auth/google/callback',
      proxy: true
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const existingUser = await User.findOne({
          'auth.googleId': profile.id
        });

        if (existingUser) return done(null, existingUser);

        const user = await new User({
          auth: {
            googleId: profile.id,
            email: profile.emails[0].value,
            idHash: idHash(profile.emails[0].value),
            name: profile.displayName
          }
        }).save();

        done(null, user);
      } catch (err) {
        done(err);
      }
    }
  )
);
