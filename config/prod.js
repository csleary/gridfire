const fs = require('fs');
const path = require('path');

module.exports = {
  cookieKey: process.env.COOKIE_KEY,
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  mongoURI: process.env.MONGO_URI,
  nemp3EmailContact: process.env.NEMP3_EMAIL_CONTACT,
  nemp3EmailSupport: process.env.NEMP3_EMAIL_SUPPORT,
  smtpHostName: process.env.NEMP3_SMTP_HOST,
  smtpUsername: process.env.NEMP3_SMTP_USER,
  smtpPassword: process.env.NEMP3_SMTP_PASSWORD,
  dkimKey: fs.readFileSync(path.join(__dirname, '/../../dkimKey'), 'utf8'),
  nemp3Secret: process.env.NEMP3_SECRET,
  recaptchaSecretKey: process.env.RECAPTCHA_SECRET_KEY
};
