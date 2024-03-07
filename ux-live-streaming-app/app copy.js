const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const session = require('express-session');
const passport = require('passport');
const path = require('path');
const rateLimit = require('express-rate-limit');
const ffmpeg = require('fluent-ffmpeg');
require('dotenv').config();
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const streamRoutes = require('./routes/streamRoutes');
const playlistRoutes = require('./routes/playlistRoutes');
const User = require('./models/User');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');

// Rate limiting middleware
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again after 15 minutes',
});
app.use(apiLimiter);

// Session configuration
app.use(session({
  secret: process.env.SECRET_KEY,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: 'auto', maxAge: 86400000 },
}));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

passport.use(new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: 'http://localhost:3000/auth/google/callback/',
    accessType: 'offline', // Request refresh token
    prompt: 'consent', // Prompt for consent each time
  },
  async (accessToken, refreshToken, profile, cb) => {
    try {
      console.log(`XXX access Token => ${accessToken}  -- refresh token -- ${refreshToken} XXX`);
      console.log(`profile XXXX ${JSON.stringify(profile, null, 2)}`);
      const {
        id, displayName, name, photos, emails,
      } = profile;
      const newUser = {
        googleId: id,
        displayName,
        firstName: name.givenName,
        lastName: name.familyName,
        image: photos && photos.length > 0 ? photos[0].value : null,
        email: emails && emails.length > 0 ? emails[0].value : null,
        accessToken,
        refreshToken,
      };
      const user = await User.findOneAndUpdate(
        { googleId: id },
        newUser,
        { new: true, upsert: true },
      );
      cb(null, user);
    } catch (err) {
      console.error('Error processing Google auth: ', err);
      cb(err, null);
    }
  },
));

// Passport configuration
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/auth/google', passport.authenticate(
  'google',
  {
    scope: [
      'https://www.googleapis.com/auth/youtube.force-ssl',
      'openid',
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/youtube.force-ssl',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/youtube.readonly',
    ],
  },
));

app.get(
  '/auth/google/callback',
  // passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    // Assuming the user object is stored in req.user after successful authentication
    if (req.user) {
      // Update the session with the user details
      req.session.user = req.user;
    }
    console.log(`Session user after auth: ${JSON.stringify(req.session.user)}`);
    res.redirect('/stream');
  },
);


app.use('/api/stream', streamRoutes);
app.use('/youtube', playlistRoutes);
app.get('/', (req, res) => res.send(`Home Page user: ${req.user}`));
app.get('/stream', (req, res) => res.render('stream', { user: req.user }));

app.get('/auth/logout', (req, res) => {
  req.logout(() => console.log('user logged out'));
  res.redirect('/');
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
  next();
});

// Socket.io setup
io.on('connection', (socket) => {
  console.log('Client connected');

  let command;

  socket.on('stream', (byte) => {
    console.log(`byte recieve >>>>> ${byte}`);
    if (!command) {
      command = ffmpeg()
        .input('-')
        .inputFormat('mpegts')
        .addOptions([
          '-c:v libx264',
          '-preset veryfast',
          '-maxrate 3000k',
          '-bufsize 6000k',
          '-pix_fmt yuv420p',
          '-g 50',
          '-c:a aac',
          '-b:a 160k',
          '-ac 2',
          '-ar 44100',
        ])
        .on('start', (commandLine) => {
          console.log(`Spawned Ffmpeg with command: ${commandLine} `);
        })
        .on('error', (err, stdout, stderr) => {
          console.error('Error:', err);
        })
        .on('end', () => {
          console.log('Streaming finished');
        })
        .output('rtmp://a.rtmp.youtube.com/live2/your-stream-key')
        .outputFormat('flv')
        .run();
    }

    if (command) {
      command.stdin.write(byte);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
    if (command) {
      command.kill('SIGINT');
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT} `));
