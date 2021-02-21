global.__basedir = __dirname;
const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');
const cookieSession = require('cookie-session');
const keys = require('./config/keys');
const mongoose = require('mongoose');
const passport = require('passport');
var server = app.listen(process.env.PORT || 8083);
var io = require('socket.io')(server);
app.set('socketio', io);

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

// mongoose.set('debug', true);

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
    maxAge: 1 * 24 * 60 * 60 * 1000
  })
);

app.use(passport.initialize());
app.use(passport.session());

require('./services/rabbitMQ')(app);
require('./routes/artistRoutes')(app);
require('./routes/artworkRoutes')(app);
require('./routes/authRoutes')(app);
require('./routes/downloadRoutes')(app);
require('./routes/emailRoutes')(app);
require('./routes/musicRoutes')(app);
require('./routes/nemRoutes')(app);
require('./routes/releaseRoutes')(app);
require('./routes/trackRoutes')(app);
require('./routes/userRoutes')(app);
require('./routes/socketRoutes')(app);

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
