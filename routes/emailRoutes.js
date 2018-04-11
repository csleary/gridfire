const nodemailer = require('nodemailer');
const request = require('request');
const keys = require('../config/keys');

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
          res.status(500).send(`Error: ${error}`);
        }

        const mailOptions = {
          from: req.body.email,
          to: 'nemp3@ochremusic.com',
          subject: 'NEMp3 Contact Form',
          text: req.body.message
        };

        transporter.sendMail(mailOptions, err => {
          if (err) {
            res.status(500).send(`Error! Could not send message: ${err}`);
          } else {
            res.status(200).send('Thanks! Message sent.');
          }
        });
      }
    );
  });
};
