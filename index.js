global.__basedir = __dirname;
const { clientErrorHandler, errorHandler, logErrors } = require(__basedir + '/middlewares/errorHandlers');
const express = require('express');
const app = express();
const httpServer = require('http').createServer(app);
const connectRabbitmq = require(__basedir + '/services/rabbitmq');
const connectStomp = require(__basedir + '/services/rxstomp');
const connectSocketio = require(__basedir + '/services/socketio');
const cookieParser = require('cookie-parser');
const cookieSession = require('cookie-session');
const keys = require('./config/keys');
const mongoose = require('mongoose');
const passport = require('passport');
global.WebSocket = require('ws');
require('./models/Artist');
require('./models/CreditPayment');
require('./models/Favourite');
require('./models/PaymentSession');
require('./models/Release');
require('./models/Sale');
require('./models/Play');
require('./models/StreamSession');
require('./models/User');
require('./models/Wish');
require('./services/passport');
const artists = require('./routes/artistRoutes');
const artwork = require('./routes/artworkRoutes');
const auth = require('./routes/authRoutes');
const catalogue = require('./routes/catalogueRoutes');
const download = require('./routes/authRoutes');
const email = require('./routes/emailRoutes');
const nem = require('./routes/nemRoutes');
const release = require('./routes/releaseRoutes');
const track = require('./routes/trackRoutes');
const user = require('./routes/userRoutes');

const config = {
  useFindAndModify: false,
  useCreateIndex: true,
  useNewUrlParser: true,
  useUnifiedTopology: true
};

const connect = async () => {
  try {
    await mongoose.connect(keys.mongoURI, config);
  } catch ({ message }) {
    console.error('Mongoose connection error: %s', message);
  }
};

mongoose.set('debug', process.env.NODE_ENV === 'development');
const db = mongoose.connection;
db.once('open', () => console.log('Mongoose connected.'));
db.on('error', () => app.get('socketio').emit('error', { message: 'Database connection error.' }));

db.on('disconnected', () => {
  console.error('Mongoose disconnected. Attempting to reconnect in 5 seconds…');
  setTimeout(connect, 5000, keys.mongoURI, config);
});

connect();
app.use(express.json());
app.use(cookieParser(keys.cookieKey));

app.use(
  cookieSession({
    name: 'nemp3 session',
    keys: [keys.cookieKey],
    maxAge: 28 * 24 * 60 * 60 * 1000
  })
);

app.use(clientErrorHandler);
app.use(errorHandler);
app.use(logErrors);
app.use(passport.initialize());
app.use(passport.session());
app.use('/api/artists', artists);
app.use('/api/artwork', artwork);
app.use('/api/auth', auth);
app.use('/api/catalogue', catalogue);
app.use('/api/download', download);
app.use('/api/email', email);
app.use('/api/nem', nem);
app.use('/api/release', release);
app.use('/api/track', track);
app.use('/api/user', user);

const connectServices = async () => {
  const rxStomp = await connectStomp();
  const io = connectSocketio(httpServer, rxStomp);
  connectRabbitmq(io);
  app.set('socketio', io);
};

httpServer.listen(process.env.PORT || 8083, () => {
  console.log('Express server running.');
  connectServices();
});
