const crypto = require('crypto');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const request = require('request');
const keys = require('../config/keys');

const User = mongoose.model('users');

const defaults = {
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: keys.nemp3EmailAddress,
    pass: keys.nemp3EmailPassword
  }
};
const transporter = nodemailer.createTransport(defaults);

module.exports = app => {
  app.post('/api/contact', async (req, res) => {
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
          res.status(500).send({ error: `Error: ${error}` });
        }

        const mailOptions = {
          from: req.body.email,
          to: keys.nemp3EmailAddress,
          subject: 'NEMp3 Contact Form',
          text: req.body.message
        };

        transporter.sendMail(mailOptions, err => {
          if (err) {
            res
              .status(500)
              .send({ error: `Error! Could not send message: ${err}` });
          } else {
            res.status(200).send({ message: 'Thanks! Message sent.' });
          }
        });
      }
    );
  });

  app.post('/api/auth/reset', async (req, res) => {
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
            throw new Error(error);
          }

          const { email } = req.body;
          const user = await User.findOne({ 'auth.email': email });

          if (!user) {
            throw new Error("Error! We can't find a user with that address.");
          }

          const token = await crypto.randomBytes(20).toString('hex');

          user
            .update({
              'auth.resetToken': token,
              'auth.resetExpire': Date.now() + 3600000
            })
            .exec()
            .then(() => {
              const mailOptions = {
                from: req.body.email,
                to: keys.nemp3EmailAddress,
                subject: 'NEMp3 Password Reset Requested',
                text: `Hi!\n\n
                A password reset was requested for this NEMp3 account. To reset and choose a new password, please visit the URL below.\n\n
                http://localhost:3000/reset/${token}\n\n
                If you did not request this, you can safely ignore this email.\n\n
                Best wishes,\n
                NEMp3`
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
        }
      );
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
          "Error! The reset token cannot be found (perhaps it's expired). Please request another reset."
        );
      }

      user.auth.password = passwordNew;
      user.auth.resetToken = undefined;
      user.auth.resetExpire = undefined;
      user.save().then(updatedUser => {
        const mailOptions = {
          from: req.body.email,
          to: keys.nemp3EmailAddress,
          subject: 'Success! Your NEMp3 password has been reset.',
          text: `Hi!\n\n
            We can confirm that your NEMp3 password has successfully been reset.\n\n
            Best wishes,\n
            NEMp3`
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
