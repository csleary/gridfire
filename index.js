global.__basedir = __dirname;
const { RxStomp } = require('@stomp/rx-stomp');
const { SOCKET_HOST } = require('./config/constants');
const express = require('express');
const app = express();
const httpServer = require('http').createServer(app);
const cookieParser = require('cookie-parser');
const cookieSession = require('cookie-session');
const { findNode } = require('./controllers/nemController');
const keys = require('./config/keys');
const mongoose = require('mongoose');
const passport = require('passport');
Object.assign(global, { WebSocket: require('ws') });

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
require('./services/rabbitMQ')(app);

mongoose.set('debug', process.env.NODE_ENV === 'development');

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

const db = mongoose.connection;
db.once('open', () => console.log('Mongoose connected.'));
db.on('error', () => io.emit('error', { message: 'Database connection error.' }));

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

app.use(passport.initialize());
app.use(passport.session());

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

const connectStomp = async () => {
  const { host: nis } = (await findNode()) || {};
  const rxStomp = new RxStomp();

  rxStomp.configure({
    brokerURL: `ws://${nis}:7778/w/messages/websocket`,
    debug: str => process.env.NODE_ENV === 'development' && console.log('STOMP: ' + str),
    reconnectDelay: 1000
  });

  rxStomp.activate();
  return rxStomp;
};

const io = require('socket.io')(httpServer, {
  cors: {
    origin: SOCKET_HOST,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

const registerSocketRoutes = require('./routes/socketRoutes');

const onConnection = async socket => {
  const rxStomp = await connectStomp();
  registerSocketRoutes(io, socket, rxStomp);
};

io.on('connection', onConnection);
app.set('socketio', io);

const logErrors = (error, req, res, next) => {
  console.error(error);
  next(error);
};

const clientErrorHandler = (error, req, res, next) => {
  if (req.xhr) {
    console.error('Error processing client request: %s', req.headers.host);
    res.status(500).send({ error: 'An API server error occurred.' });
  } else {
    next(error);
  }
};

const errorHandler = (error, req, res, next) => {
  if (res.headersSent) return next(error);
  res.status(500).send({ error });
};

app.use(logErrors);
app.use(clientErrorHandler);
app.use(errorHandler);

process.on('uncaughtException', error => {
  console.error(`Uncaught error: ${error.message}`);
  if (process.env.NODE_ENV === 'production') process.exit(1);
});

httpServer.listen(process.env.PORT || 8083, () => console.log('Express server running.'));
