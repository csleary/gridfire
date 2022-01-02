import FormData from 'form-data';
import axios from 'axios';
import fs from 'fs';
import express from 'express';
import nodemailer from 'nodemailer';

const { NEMP3_EMAIL_CONTACT, NEMP3_SMTP_HOST, NEMP3_SMTP_PASSWORD, NEMP3_SMTP_USER } = process.env;
const router = express.Router();

const defaults = {
  host: NEMP3_SMTP_HOST,
  port: 587,
  secure: false,
  dkim: {
    domainName: 'nemp3.app',
    keySelector: 'nodemailer',
    privateKey: fs.readFileSync('dkimKey', 'utf8')
  },
  auth: {
    user: NEMP3_SMTP_USER,
    pass: NEMP3_SMTP_PASSWORD
  }
};

const transporter = nodemailer.createTransport(defaults);

router.post('/contact', async (req, res) => {
  try {
    const url = 'https://www.google.com/recaptcha/api/siteverify';
    const form = new FormData();
    form.append('secret', RECAPTCHA_SECRET_KEY);
    form.append('response', req.body.recaptcha);
    const contentLength = form.getLengthSync();
    const headers = { ...form.getHeaders(), 'Content-Length': contentLength };
    const recaptchaRes = await axios.post(url, form, { headers });
    const recaptchaBody = recaptchaRes.data;

    if (recaptchaBody.error) {
      throw new Error(recaptchaBody.error);
    }

    const mailOptions = {
      from: NEMP3_EMAIL_CONTACT,
      to: NEMP3_EMAIL_CONTACT,
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
