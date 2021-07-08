import { clientErrorHandler, errorHandler, logErrors } from './middlewares/errorHandlers.js';
import { cookieKey, mongoURI } from './config/keys.js';
import WebSocket from 'ws';
import express from 'express';
import httpServer from 'http';
import connectRabbitmq from './services/rabbitmq/index.js';
import connectStomp from './services/rxstomp/index.js';
import connectSocketio from './services/socketio.js';
import cookieParser from 'cookie-parser';
import cookieSession from 'cookie-session';
import mongoose from 'mongoose';
import passport from 'passport';
import './models/Artist.js';
import './models/CreditPayment.js';
import './models/Favourite.js';
import './models/PaymentSession.js';
import './models/Release.js';
import './models/Sale.js';
import './models/Play.js';
import './models/StreamSession.js';
import './models/User.js';
import './models/Wish.js';
import './services/passport.js';
import artists from './routes/artistRoutes.js';
import artwork from './routes/artworkRoutes.js';
import auth from './routes/authRoutes.js';
import catalogue from './routes/catalogueRoutes.js';
import download from './routes/downloadRoutes.js';
import email from './routes/emailRoutes.js';
import nem from './routes/nemRoutes.js';
import release from './routes/releaseRoutes.js';
import track from './routes/trackRoutes.js';
import user from './routes/userRoutes.js';

const app = express();
const server = httpServer.createServer(app);
global.WebSocket = WebSocket;
const rxStomp = await connectStomp();
const io = connectSocketio(server, rxStomp);
app.set('socketio', io);
await connectRabbitmq(io).catch(error => console.error(error));

const mongooseConfig = {
  useFindAndModify: false,
  useCreateIndex: true,
  useNewUrlParser: true,
  useUnifiedTopology: true
};

const connectMongoose = async () => {
  try {
    await mongoose.connect(mongoURI, mongooseConfig);
  } catch ({ message }) {
    console.error('Mongoose connection error: %s', message);
  }
};

mongoose.set('debug', process.env.NODE_ENV === 'development');
const db = mongoose.connection;
db.once('open', async () => console.log('Mongoose connected.'));
db.on('error', () => io.emit('error', { message: 'Database connection error.' }));

db.on('disconnected', () => {
  console.error('Mongoose disconnected. Attempting to reconnect in 5 seconds…');
  setTimeout(mongoose.connect, 5000, mongoURI, mongooseConfig);
});

await connectMongoose();
app.use(express.json());
app.use(cookieParser(cookieKey));
app.use(cookieSession({ name: 'nemp3 session', keys: [cookieKey], maxAge: 28 * 24 * 60 * 60 * 1000 }));
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

server.listen(process.env.PORT || 8083, () => console.log('Express server running.'));
