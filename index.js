global.__basedir = __dirname;
const app = require('express')();
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const keys = require('./config/keys');
const mongoose = require('mongoose');
const passport = require('passport');
var server = app.listen(process.env.PORT || 8083);
var io = require('socket.io')(server);
app.set('socketio', io);

require('./models/Artist');
require('./models/User');
require('./models/Release');
require('./models/Sale');
require('./services/passport');

mongoose.connect(keys.mongoURI, {
  useFindAndModify: false,
  useCreateIndex: true,
  useNewUrlParser: true,
  useUnifiedTopology: true
});

mongoose.set('debug', true);
app.use(bodyParser.json());

app.use(
  cookieSession({
    name: 'nemp3 session',
    keys: [keys.cookieKey],
    maxAge: 28 * 24 * 60 * 60 * 1000
  })
);

app.use(passport.initialize());
app.use(passport.session());

require('./services/rabbitMQ')(app);
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

process.on('uncaughtException', error => {
  console.error(`There was an uncaught error: ${error}`);
  process.exit(1);
});
