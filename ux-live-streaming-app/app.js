const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const session = require('express-session');
const passport = require('passport');
const path = require('path');
const rateLimit = require('express-rate-limit');
// const ffmpeg = require('fluent-ffmpeg');
const bodyParser = require('body-parser');
// const gst = require('gstreamer-superficial');
const { spawn } = require('child_process');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const cookieParser = require('cookie-parser');

const { startBroadcast } = require('./src/services/startBroadcast');
require('dotenv').config();

const streamRoutes = require('./routes/streamRoutes');
const youtubeRoutes = require('./routes/youtubeRoute');
const User = require('./models/User');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');

app.use(cookieParser());
app.use(bodyParser.json());

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
      // console.log(`XXX access Token => ${accessToken}  -- refresh token -- ${refreshToken} XXX`);
      // console.log(`profile XXXX ${JSON.stringify(profile, null, 2)}`);
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
    if (req.user) {
      req.session.user = req.user;
    }
    console.log(`Session user after auth: ${JSON.stringify(req.session.user)}`);
    const cookieOptions = {
      maxAge: 1000 * 60 * 60 * 24, // 1 day
      httpOnly: true,
    };
    const { googleId, accessToken } = req.session.user;
    res
      .cookie('accessToken', accessToken, cookieOptions)
      .cookie('googleId', googleId, cookieOptions)
      .redirect('/stream');
  },
);

app.get('/', async (req, res) => {
  let { user } = req.session;
  if (!user) {
    try {
      const googleId = req.cookies?.googleId;
      if (googleId) {
        user = await User.findOne({ googleId });
        if (user) {
          req.session.user = user;
          return res.send(`Home Page user: ${req.session.user.displayName}`);
        }
        return res.send('Login throught google: localhost:3000/auth/google/');
      }
    } catch (err) {
      console.error('Error getting user from cookie:', err);
      return res.send('Login throught google: localhost:3000/auth/google/');
    }
  }
  return res.send(`Home Page user: ${req.session.userdisplayName}`);
});

app.get('/stream', async (req, res) => {
  let { user } = req.session;
  if (!user) {
    try {
      const googleId = req.cookies?.googleId;
      if (googleId) {
        user = await User.findOne({ googleId });
        if (user) {
          req.session.user = user;
          return res.send(`Home Page user: ${req.session.user.displayName}`);
        }
        return res.redirect('/');
      }
    } catch (err) {
      console.error('Error getting user from cookie:', err);
      return res.redirect('/');
    }
  }
  return res.render('stream', { user: req.session.user });
});

app.use('/api/stream', streamRoutes);
app.use('/youtube', youtubeRoutes);

app.get('/auth/logout', (req, res) => {
  req.logout(() => console.log('user logged out'));
  res.redirect('/');
});

app.post('/startBroadcast', async (req, res) => {
  const {
    videoPrivacyStatus, videoTitle, playlistId,
  } = req.body;
  const { accessToken } = req.session.user;
  // Ensure all required fields are provided
  if (!accessToken || !videoPrivacyStatus || !videoTitle) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Start the broadcast
    const result = await startBroadcast(accessToken, videoPrivacyStatus, videoTitle, playlistId);

    if (result.error) {
      return res.status(500).json({ error: result.error });
    }

    // Respond back with the result
    return res.json(result);
  } catch (error) {
    console.error('Error starting broadcast:', error);
    return res.status(500).json({ error: 'Failed to start broadcast' });
  }
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
  next();
});

// const { spawn } = require('child_process');
// const io = require('socket.io')(server); // Ensure your server is properly initialized

io.on('connection', (socket) => {
  console.log('Client connected');

  let ffmpegProcess; // This will hold the reference to the FFmpeg child process

  socket.on('rtmpUrl', (data) => {
    const { rtmpUrl } = data;
    console.log(`Received new RTMP URL: ${rtmpUrl}`);

    if (!ffmpegProcess) {
      // Start FFmpeg child process with the appropriate command
      const ffmpegArgs = [
        // '-f', 'webm',
        // '-i', '-', // Input from stdin
        // '-c', 'copy', // Copy video and audio codecs without re-encoding
        // '-f', 'flv',
        // rtmpUrl, // Output to RTMP server
        // 'ffmpeg',
        '-vcodec', 'copy',
        '-acodec', 'aac',
        '-f', 'flv',
        '-preset', 'ultrafast',
        '-tune', 'zerolatency', // Enable zerolatency tuning
        rtmpUrl,
      ];

      ffmpegProcess = spawn('ffmpeg', ffmpegArgs);

      ffmpegProcess.stdout.on('data', (data) => {
        console.log(`FFmpeg stdout: ${data}`);
      });

      ffmpegProcess.stderr.on('data', (data) => {
        console.error(`FFmpeg stderr: ${data}`);
      });

      ffmpegProcess.on('close', (code) => {
        console.log(`FFmpeg child process exited with code ${code}`);
        ffmpegProcess = null; // Reset the reference
      });

      // Emit 'ffmpegReady' event once FFmpeg process is initialized
      socket.emit('ffmpegReady');
    } else {
      console.log('FFmpeg process is already running.');
    }
  });

  socket.on('stream', (byteBuffer) => {
    if (ffmpegProcess) {
      ffmpegProcess.stdin.write(byteBuffer);
    } else {
      console.log('FFmpeg process not initialized. Ignoring stream data.');
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
    if (ffmpegProcess) {
      ffmpegProcess.kill('SIGINT');
      ffmpegProcess = null; // Ensure the process reference is reset
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT} `));
