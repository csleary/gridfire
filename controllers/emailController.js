import fs from 'fs';
import nodemailer from 'nodemailer';

const { NEMP3_EMAIL_GENERAL, NEMP3_SMTP_HOST, NEMP3_SMTP_PASSWORD, NEMP3_SMTP_USER } = process.env;

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

const sendEmail = (recipient, subject, body) =>
  new Promise((resolve, reject) => {
    const transporter = nodemailer.createTransport(defaults);

    const mailOptions = {
      from: NEMP3_EMAIL_GENERAL,
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
