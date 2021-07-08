import fs from 'fs';

const cookieKey = process.env.COOKIE_KEY;
const dkimKey = fs.readFileSync('dkimKey', 'utf8');
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const mongoURI = process.env.MONGO_URI;
const nemp3EmailContact = process.env.NEMP3_EMAIL_CONTACT;
const nemp3EmailGeneral = process.env.NEMP3_EMAIL_GENERAL;
const nemp3EmailSupport = process.env.NEMP3_EMAIL_SUPPORT;
const nemp3Secret = process.env.NEMP3_SECRET;
const privKey = process.env.PRIV_KEY;
const rabbitUser = process.env.RABBITMQ_DEFAULT_USER;
const rabbitPass = process.env.RABBITMQ_DEFAULT_PASS;
const recaptchaSecretKey = process.env.RECAPTCHA_SECRET_KEY;
const smtpHostName = process.env.NEMP3_SMTP_HOST;
const smtpPassword = process.env.NEMP3_SMTP_PASSWORD;
const smtpUsername = process.env.NEMP3_SMTP_USER;
const spotifyClientId = process.env.SPOTIFY_CLIENT_ID;
const spotifyClientSecret = process.env.SPOTIFY_CLIENT_SECRET;
const twitterConsumerKey = process.env.TWITTER_CONSUMER_KEY;
const twitterConsumerSecret = process.env.TWITTER_CONSUMER_SECRET;

export {
  cookieKey,
  dkimKey,
  googleClientId,
  googleClientSecret,
  mongoURI,
  nemp3EmailContact,
  nemp3EmailGeneral,
  nemp3EmailSupport,
  nemp3Secret,
  privKey,
  rabbitUser,
  rabbitPass,
  recaptchaSecretKey,
  smtpHostName,
  smtpPassword,
  smtpUsername,
  spotifyClientId,
  spotifyClientSecret,
  twitterConsumerKey,
  twitterConsumerSecret
};
