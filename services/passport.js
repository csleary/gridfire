const crypto = require('crypto');
const keys = require('../config/keys');
const mongoose = require('mongoose');
const passport = require('passport');
const request = require('request');
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const SpotifyStrategy = require('passport-spotify').Strategy;
const User = mongoose.model('users');
const { GOOGLE_CALLBACK, SPOTIFY_CALLBACK } = require('../config/constants');

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id, '-__v -auth.password', { lean: true }).exec();
  done(null, user);
});

const idHash = emailAddress => {
  const hash = crypto.createHash('sha256');
  return hash.update(emailAddress).update(keys.nemp3Secret).update(Date.now().toFixed()).digest('hex').substring(0, 31);
};

const localLogin = async (email, password, done) => {
  try {
    const user = await User.findOne({ 'auth.email': email }, '-__v').exec();

    if (!user) {
      return done(null, false, 'Login details incorrect.');
    }

    const isMatched = await user.comparePassword(password);

    if (!isMatched) {
      return done(null, false, 'Login details incorrect.');
    }

    user.auth.lastLogin = Date.now();
    const userUpdate = await user.save();
    done(null, userUpdate);
  } catch (error) {
    return done(error);
  }
};

const localRegister = async (req, email, password, done) => {
  const url = 'https://www.google.com/recaptcha/api/siteverify';
  const data = { form: { secret: keys.recaptchaSecretKey, response: req.body.recaptcha } };

  try {
    request.post(url, data, async (error, response, body) => {
      if (!JSON.parse(body).success) {
        return done(null, false, body['error-codes']);
      }

      const user = await User.findOne({ 'auth.email': email }).exec();

      if (user) {
        return done(null, false, 'Email already in use.');
      }

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
    });
  } catch (error) {
    return done(error);
  }
};

const localUpdate = async (req, email, password, done) => {
  try {
    const user = await User.findOne({ 'auth.email': email }).exec();

    if (!user) {
      return done(null, false, 'Incorrect username.');
    }

    const isMatched = await user.comparePassword(password);

    if (!isMatched) {
      return done(null, false, 'Incorrect password.');
    }

    if (req.body.passwordNew !== req.body.passwordConfirm) {
      return done(null, false, 'Passwords do not match.');
    }

    user.auth.password = req.body.passwordNew;
    await user.save();
    done(null, user);
  } catch (error) {
    return done(error);
  }
};

const loginGoogle = async (accessToken, refreshToken, profile, done) => {
  try {
    const existingUser = await User.findOne({ 'auth.oauthId': profile.id }).exec();
    const email = profile.emails[0].value;

    if (existingUser) {
      existingUser.updateOne({ 'auth.lastLogin': Date.now() }).exec();
      return done(null, existingUser);
    }

    const user = await User.create({
      auth: {
        oauthService: 'google',
        oauthId: profile.id,
        email,
        idHash: idHash(email),
        isLocal: false,
        lastLogin: Date.now()
      }
    });

    done(null, user);
  } catch (err) {
    done(err);
  }
};

const loginSpotify = async (accessToken, refreshToken, expires_in, profile, done) => {
  try {
    const existingUser = await User.findOne({ 'auth.oauthId': profile.id }).exec();
    const email = profile.emails[0].value;

    if (existingUser) {
      existingUser.updateOne({ 'auth.lastLogin': Date.now() }).exec();
      return done(null, existingUser);
    }

    const user = await User.create({
      auth: {
        oauthService: 'spotify',
        oauthId: profile.id,
        email,
        idHash: idHash(email),
        isLocal: false,
        lastLogin: Date.now()
      }
    });

    done(null, user);
  } catch (err) {
    done(err);
  }
};

passport.use('local-login', new LocalStrategy({ usernameField: 'email' }, localLogin));
passport.use('local-register', new LocalStrategy({ usernameField: 'email', passReqToCallback: true }, localRegister));
passport.use('local-update', new LocalStrategy({ usernameField: 'email', passReqToCallback: true }, localUpdate));

const googleConfig = {
  clientID: keys.googleClientId,
  clientSecret: keys.googleClientSecret,
  callbackURL: GOOGLE_CALLBACK,
  proxy: true
};

passport.use(new GoogleStrategy(googleConfig, loginGoogle));

const spotifyConfig = {
  clientID: keys.spotifyClientId,
  clientSecret: keys.spotifyClientSecret,
  callbackURL: SPOTIFY_CALLBACK
};

passport.use(new SpotifyStrategy(spotifyConfig, loginSpotify));
