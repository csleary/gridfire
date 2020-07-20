const crypto = require('crypto');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const rp = require('request-promise-native');
const {
  nemp3EmailContact,
  nemp3EmailSupport,
  dkimKey,
  recaptchaSecretKey,
  smtpHostName,
  smtpPassword,
  smtpUsername
} = require('../config/keys');

const User = mongoose.model('users');

const defaults = {
  host: smtpHostName,
  port: 587,
  secure: false,
  dkim: {
    domainName: 'nemp3.app',
    keySelector: 'nodemailer',
    privateKey: dkimKey
  },
  auth: {
    user: smtpUsername,
    pass: smtpPassword
  }
};

const transporter = nodemailer.createTransport(defaults);

module.exports = app => {
  app.post('/api/contact', async (req, res) => {
    try {
      const options = {
        method: 'POST',
        uri: 'https://www.google.com/recaptcha/api/siteverify',
        form: {
          secret: recaptchaSecretKey,
          response: req.body.recaptcha
        },
        json: true
      };

      const recaptchaBody = await rp(options);

      if (recaptchaBody.error) {
        throw new Error(recaptchaBody.error);
      }

      const mailOptions = {
        from: nemp3EmailContact,
        to: nemp3EmailContact,
        replyTo: req.body.email,
        subject: 'nemp3 Contact Form',
        text: req.body.message
      };

      transporter.sendMail(mailOptions, error => {
        if (error) {
          throw new Error(`Error! Could not send message: ${error}`);
        } else {
          res.status(200).send({ success: 'Thanks! Message sent.' });
        }
      });
    } catch (error) {
      res.status(417).send({ error: error.message });
    }
  });

  app.post('/api/auth/reset', async (req, res) => {
    try {
      const options = {
        method: 'POST',
        uri: 'https://www.google.com/recaptcha/api/siteverify',
        form: {
          secret: recaptchaSecretKey,
          response: req.body.recaptcha
        },
        json: true
      };

      const recaptchaBody = await rp(options);

      if (recaptchaBody.error) {
        throw new Error(recaptchaBody.error);
      }

      const { email } = req.body;
      const user = await User.findOne({ 'auth.email': email });

      if (!user) {
        throw new Error('We cannot find a user with that address.');
      }

      const token = await crypto.randomBytes(20).toString('hex');

      user
        .update({
          'auth.resetToken': token,
          'auth.resetExpire': Date.now() + 3600000
        })
        .exec()
        .then(() => {
          const siteUrl = `${`${req.protocol}://${req.headers.host || req.hostname}`}/reset/`;

          const mailOptions = {
            from: nemp3EmailSupport,
            to: email,
            subject: 'nemp3 Password Reset Requested',
            text: `Hi!

A password reset was requested for this nemp3 account. To reset and choose a new password, please visit the URL below.

${siteUrl}${token}

If you did not request this, you can safely ignore this email.

Best wishes,
The nemp3 team`
          };

          transporter.sendMail(mailOptions, error => {
            if (error) {
              throw new Error(`Could not send password reset email: ${error}`);
            }
          });

          res.send({
            success: `Thank you. An email has been sent to ${email}.`
          });
        });
    } catch (error) {
      res.status(417).send({ error: error.message });
    }
  });

  app.get('/api/auth/reset/:token', async (req, res) => {
    try {
      const { token } = req.params;

      const user = await User.findOne({
        'auth.resetToken': token,
        'auth.resetExpire': { $gt: Date.now() }
      });

      if (!user) {
        throw new Error('Either the user does not exist or the token has expired.');
      }

      res.end();
    } catch (error) {
      res.status(417).send({ error: error.message });
    }
  });

  app.post('/api/auth/reset/:token', async (req, res) => {
    try {
      const { token } = req.params;
      const { passwordNew, passwordConfirm } = req.body;

      if (passwordNew !== passwordConfirm) {
        throw new Error('The passwords do not match.');
      }

      const user = await User.findOne({
        'auth.resetToken': token,
        'auth.resetExpire': { $gt: Date.now() }
      });

      if (!user) {
        throw new Error('The reset token cannot be found (perhaps it has expired). Please request another reset.');
      }

      user.auth.password = passwordNew;
      user.auth.resetToken = undefined;
      user.auth.resetExpire = undefined;
      user.save().then(updatedUser => {
        const mailOptions = {
          from: nemp3EmailSupport,
          to: user.auth.email,
          subject: 'Success! Your nemp3 password has been reset.',
          text: `Hi!

We can confirm that your nemp3 password has successfully been reset.

Best wishes,
The nemp3 team`
        };

        transporter.sendMail(mailOptions, error => {
          if (error) {
            res.status(417).send({ error: 'Could not send password reset confirmation.' });
            return console.error(error);
          }

          res.send(updatedUser.auth.email);
        });
      });
    } catch (error) {
      res.status(417).send({ error: error.message });
    }
  });
};
