import { clientErrorHandler, errorHandler, logErrors } from './middlewares/errorHandlers.js';
import { cookieKey, mongoURI } from './config/keys.js';
import WebSocket from 'ws';
import express from 'express';
import amqp from './controllers/amqp/index.js';
import cookieParser from 'cookie-parser';
import cookieSession from 'cookie-session';
import mongoose from 'mongoose';
import passport from 'passport';
import './models/Artist.js';
import './models/CreditPayment.js';
import './models/Favourite.js';
import './models/Release.js';
import './models/Sale.js';
import './models/Play.js';
import './models/StreamSession.js';
import './models/User.js';
import './models/Wish.js';
import './controllers/passport.js';
import artists from './routes/artistRoutes.js';
import artwork from './routes/artworkRoutes.js';
import auth from './routes/authRoutes.js';
import catalogue from './routes/catalogueRoutes.js';
import { createServer } from 'http';
import download from './routes/downloadRoutes.js';
import email from './routes/emailRoutes.js';
import socketio from './controllers/socket.io.js';
import release from './routes/releaseRoutes.js';
import track from './routes/trackRoutes.js';
import user from './routes/userRoutes.js';

global.WebSocket = WebSocket;

const app = express();
const server = createServer(app);
const port = process.env.PORT || 8083;
server.listen(port, () => console.log(`[Express] Server running on port ${port || 8083}.`));

// Socket.io
const io = socketio(server);
app.set('socketio', io);

// RabbitMQ
await amqp(io).catch(console.error);

// Mongoose
const db = mongoose.connection;
db.once('open', async () => console.log('[Mongoose] Connected.'));
db.on('error', () => io.emit('error', { message: '[Mongoose] Connection error.' }));

db.on('disconnected', () => {
  console.error('[Mongoose] Disconnected. Attempting to reconnect in 5 seconds…');
  setTimeout(mongoose.connect, 5000, mongoURI);
});

await mongoose.connect(mongoURI).catch(console.error);

// Express
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
app.use('/api/release', release);
app.use('/api/track', track);
app.use('/api/user', user);
