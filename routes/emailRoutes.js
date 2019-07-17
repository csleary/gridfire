const crypto = require('crypto');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const rp = require('request-promise-native');
const {
  nemp3EmailContact,
  nemp3EmailSupport,
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
    privateKey: `-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAABFwAAAAdzc2gtcn
NhAAAAAwEAAQAAAQEAwTRlXj3bElvlrDb34b0h7028EuDJZQ2D5zjYVYKckV/JuiP63apy
JpznZ0B6wgwnUxVGmZqMgzRVXyXaJejqLu01Ob4kGp+35IGbFCdO9nOTmZsQ+/XOzPTSAY
8+ylL3L3eeggltXmqVHlGBfOOAhEuATjDejO1kF9ZSGaUjoyit5f3xhpOeH89wIeSLfC5G
ZL++SyW+AsTHat3CrYDW1WZtaTNuYJqzSocNU6za3D7a/7u1NMWGv6mnBIIx9gXixIRS+J
4cBuJh1iEIS0WS3de7pJxz0Wn82dYfjBOxrd5QDmDvY/rZVxJSxgUlCnz4tqNN1re+OVFX
JNKGaxmoCwAAA8hmAzpdZgM6XQAAAAdzc2gtcnNhAAABAQDBNGVePdsSW+WsNvfhvSHvTb
wS4MllDYPnONhVgpyRX8m6I/rdqnImnOdnQHrCDCdTFUaZmoyDNFVfJdol6Oou7TU5viQa
n7fkgZsUJ072c5OZmxD79c7M9NIBjz7KUvcvd56CCW1eapUeUYF844CES4BOMN6M7WQX1l
IZpSOjKK3l/fGGk54fz3Ah5It8LkZkv75LJb4CxMdq3cKtgNbVZm1pM25gmrNKhw1TrNrc
Ptr/u7U0xYa/qacEgjH2BeLEhFL4nhwG4mHWIQhLRZLd17uknHPRafzZ1h+ME7Gt3lAOYO
9j+tlXElLGBSUKfPi2o03Wt745UVck0oZrGagLAAAAAwEAAQAAAQEAvo0r0RgWwfOrAQAx
2Q2Ns5Sqgr/7QdRjnKA/FY89Vk/wCMtFuGxMK3Mi833v1QThoBrix8pa/WiXLsGJd0xR9D
h1/15eA3g1iYSea/Ec+wsgryX2SVq1PQXVPj6GgkvziXhj+ALOQInESuO+X2uOLGy+vd+L
D9lul+gEj1CFZnuYsjOqoGZ8MeBiqforVJIy/zloUNq9XFPRC+uTEWi+/DlxapZy6OOflt
r8PF5lHski/UeSmo7IWxE6IMdcCmUOq6gYjQJ6nY5UIpw2moz8vgKKx5qCMrhgnxC6XDCz
I6iK+KagwXZotBHrqeOxoN5pxfkciGTPN+SPN1rpvRwOyQAAAIAlTTGR+7PHFLNWAcRBRQ
z0DGxM97nxWvdz7syOdDhjBWA05MIDcAHgUbX121iLs8s7XAA48aW+/aXW0htiOE8TZcN1
CjgQhbIKYpPi1nswJWtMxKIWjJhXyjsJr/Lnccpi1cw8AHXhNt3Sc6ybqS0bukLWBc5erM
INAyvs6UHcdQAAAIEA5LrbNAq9QhUnLxfl6cODzvRYoYvhfia6cJQwgtUqJMck9kP5Oa3A
dIZSe1Mn+zPD3npIkjatkNWWCFL1fwrk7+RmA/r4XejKKW2yYv1knvfcN9hJRp6G0Btvs7
EIS9knJF44we+i0gRbjLM6uz3Lh2Zkn/B4yQ4FQibIt1AgRCcAAACBANg9QwgNo0H90JMX
yDdSR2HqZRws/4pblxS1tt+nj5ZzWAe+/lLpngfUz05MaL9mA1B96hzro8T4WSevn3HuJ3
m6+hyr1WffMF6FVcvTZDiVL36LvBC8tZdTPcKj46XpZBhR8r5nRfa37JJDCHg0uLg54kTf
7GmuwfTTKRrqLDd9AAAADm1haWxAbmVtcDMuYXBwAQIDBA==
-----END OPENSSH PRIVATE KEY-----`
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
        from: req.body.email,
        to: nemp3EmailContact,
        subject: 'nemp3 Contact Form',
        text: req.body.message
      };

      transporter.sendMail(mailOptions, err => {
        if (err) {
          throw new Error(`Error! Could not send message: ${err}`);
        } else {
          res.status(200).send({ success: 'Thanks! Message sent.' });
        }
      });
    } catch (e) {
      res.status(417).send({ error: e.message });
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
        throw new Error('Error! We can\'t find a user with that address.');
      }

      const token = await crypto.randomBytes(20).toString('hex');

      user
        .update({
          'auth.resetToken': token,
          'auth.resetExpire': Date.now() + 3600000
        })
        .exec()
        .then(() => {
          const siteUrl = `${`${req.protocol}://${req.headers.host ||
            req.hostname}`}/reset/`;

          const mailOptions = {
            from: nemp3EmailSupport,
            to: email,
            subject: 'nemp3 Password Reset Requested',
            text: `Hi!

A password reset was requested for this nemp3 account. To reset and choose a new password, please visit the URL below.

${siteUrl}${token}

If you did not request this, you can safely ignore this email.

Best wishes,
nemp3`
          };

          transporter.sendMail(mailOptions, err => {
            if (err) {
              throw new Error(
                `Error! Could not send password reset email: ${err}`
              );
            }
          });

          res.send({
            success: `Thank you. An email has been sent to ${email}.`
          });
        });
    } catch (e) {
      res.status(417).send({ error: e.message });
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
        throw new Error(
          'Error! Either the user does not exist or the token has expired.'
        );
      }

      res.end();
    } catch (e) {
      res.status(417).send({ error: e.message });
    }
  });

  app.post('/api/auth/reset/:token', async (req, res) => {
    try {
      const { token } = req.params;
      const { passwordNew, passwordConfirm } = req.body;

      if (passwordNew !== passwordConfirm) {
        throw new Error('Error! The passwords do not match.');
      }

      const user = await User.findOne({
        'auth.resetToken': token,
        'auth.resetExpire': { $gt: Date.now() }
      });

      if (!user) {
        throw new Error(
          'Error! The reset token cannot be found (perhaps it\'s expired). Please request another reset.'
        );
      }

      user.auth.password = passwordNew;
      user.auth.resetToken = undefined;
      user.auth.resetExpire = undefined;
      user.save().then(updatedUser => {
        const mailOptions = {
          from: nemp3EmailSupport,
          to: req.body.email,
          subject: 'Success! Your nemp3 password has been reset.',
          text: `Hi!

We can confirm that your nemp3 password has successfully been reset.

Best wishes,
nemp3`
        };

        transporter.sendMail(mailOptions, err => {
          if (err) {
            throw new Error(
              `Error! Could not send password reset confirmation: ${err}`
            );
          }
        });

        res.send(updatedUser.auth.email);
      });
    } catch (e) {
      res.status(417).send({ error: e.message });
    }
  });
};
