import { nemp3EmailGeneral, dkimKey, smtpHostName, smtpPassword, smtpUsername } from '../config/keys';
import nodemailer from 'nodemailer';

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

const sendEmail = (recipient, subject, body) =>
  new Promise((resolve, reject) => {
    const transporter = nodemailer.createTransport(defaults);

    const mailOptions = {
      from: nemp3EmailGeneral,
      to: recipient,
      subject,
      text: body
    };

    transporter.sendMail(mailOptions, error => {
      if (error) return reject(error);
      resolve();
    });
  });

export { sendEmail };
