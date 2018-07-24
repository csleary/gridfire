const passport = require('passport');
const request = require('request');
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

        if (!existingUser) {
          return done(
            null,
            false,
            req.flash('error', 'Login details incorrect.')
          );
        }

        const isMatched = await existingUser.comparePassword(password);

        if (!isMatched) {
          return done(
            null,
            false,
            req.flash('error', 'Login details incorrect.')
          );
        }
        done(
          null,
          existingUser,
          req.flash('success', 'Successfully logged in.')
        );
      } catch (error) {
        return done(error);
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
        request.post(
          'https://www.google.com/recaptcha/api/siteverify',
          {
            form: {
              secret: keys.recaptchaSecretKey,
              response: req.body.recaptcha
            }
          },
          async (error, response, body) => {
            if (!JSON.parse(body).success) {
              return done(null, false, req.flash('error', body['error-codes']));
            }

            const user = await User.findOne({ 'auth.email': email });

            if (user) {
              return done(
                null,
                false,
                req.flash('error', 'User already exists.')
              );
            }

            const newUser = await new User({
              auth: {
                email,
                idHash: idHash(email),
                password
              }
            }).save();

            done(
              null,
              newUser,
              req.flash(
                'success',
                'Thanks for registering. You are now logged in.'
              )
            );
          }
        );
      } catch (err) {
        return done(
          err,
          null,
          req.flash(
            'error',
            `Sorry, there was an error completing your request. ${err}`
          )
        );
      }
    }
  )
);

passport.use(
  'local-update',
  new LocalStrategy(
    {
      usernameField: 'email',
      passReqToCallback: true
    },
    async (req, email, password, done) => {
      try {
        const existingUser = await User.findOne({ 'auth.email': email });

        if (!existingUser) {
          return done(null, false, req.flash('error', 'Incorrect username.'));
        }

        const isMatched = await existingUser.comparePassword(password);

        if (!isMatched) {
          return done(null, false, req.flash('error', 'Incorrect password.'));
        }

        if (req.body.passwordNew !== req.body.passwordConfirm) {
          return done(
            null,
            false,
            req.flash('error', 'Passwords do not match.')
          );
        }

        existingUser.auth.password = req.body.passwordNew;
        existingUser.save();
        done(
          null,
          existingUser,
          req.flash('success', 'Password updated successfully.')
        );
      } catch (error) {
        return done(error);
      }
    }
  )
);

const callbackURL =
  process.env.NODE_ENV === 'production' && process.env.NEM_NETWORK === 'mainnet'
    ? 'https://nemp3.app/auth/google/callback'
    : '/auth/google/callback';

passport.use(
  new GoogleStrategy(
    {
      clientID: keys.googleClientId,
      clientSecret: keys.googleClientSecret,
      callbackURL,
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
