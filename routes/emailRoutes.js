import {
  nemp3EmailContact,
  dkimKey,
  recaptchaSecretKey,
  smtpHostName,
  smtpPassword,
  smtpUsername
} from '../config/keys.js';
import express from 'express';
import nodemailer from 'nodemailer';
import rp from 'request-promise-native';
const router = express.Router();

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

router.post('/contact', async (req, res) => {
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

export default router;
