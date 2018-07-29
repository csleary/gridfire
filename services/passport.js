const crypto = require('crypto');
const keys = require('../config/keys');
const mongoose = require('mongoose');
const passport = require('passport');
const request = require('request');
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const User = mongoose.model('users');

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id);
  user.auth.password = undefined;
  done(null, user);
});

const idHash = emailAddress => {
  const hash = crypto.createHash('sha256');
  return hash
    .update(emailAddress)
    .update(keys.nemp3Secret)
    .digest('hex')
    .substring(0, 31);
};

passport.use(
  'local-login',
  new LocalStrategy(
    {
      usernameField: 'email',
      passReqToCallback: true
    },
    async (req, email, password, done) => {
      try {
        const user = await User.findOne({ 'auth.email': email });

        if (!user) {
          return done(
            null,
            false,
            req.flash('error', 'Login details incorrect.')
          );
        }

        const isMatched = await user.comparePassword(password);

        if (!isMatched) {
          return done(
            null,
            false,
            req.flash('error', 'Login details incorrect.')
          );
        }

        done(null, user, req.flash('success', 'Successfully logged in.'));
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
                req.flash('error', 'Email already in use.')
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
                'Thank you for registering. You are now logged in.'
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
        const user = await User.findOne({ 'auth.email': email });

        if (!user) {
          return done(null, false, req.flash('error', 'Incorrect username.'));
        }

        const isMatched = await user.comparePassword(password);

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

        user.auth.password = req.body.passwordNew;
        user.save();
        done(
          null,
          user,
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
