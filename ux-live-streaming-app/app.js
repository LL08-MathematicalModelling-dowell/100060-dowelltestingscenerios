const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const session = require('express-session');
const passport = require('passport');
const path = require('path');
const rateLimit = require('express-rate-limit');
// const ffmpeg = require('fluent-ffmpeg');
const bodyParser = require('body-parser');
const gst = require('gstreamer-superficial');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

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
    if (req.user) {
      req.session.user = req.user;
    }
    console.log(`Session user after auth: ${JSON.stringify(req.session.user)}`);
    res.redirect('/stream');
  },
);

app.get('/', (req, res) => res.send(`Home Page user: ${req.user}`));
app.get('/stream', (req, res) => res.render('stream', { user: req.user }));
app.use('/api/stream', streamRoutes);
app.use('/youtube', youtubeRoutes);

app.get('/auth/logout', (req, res) => {
  req.logout(() => console.log('user logged out'));
  res.redirect('/');
});

app.post('/startBroadcast', async (req, res) => {
  const {
    accessToken, videoPrivacyStatus, videoTitle, playlistId,
  } = req.body;

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

// Function to create a GStreamer pipeline
function createGStreamerPipeline() {
  const pipeline = new gst.Pipeline('appsrc name=source ! videoconvert ! x264enc bitrate=3000 ! flvmux ! rtmpsink location=\'rtmp://a.rtmp.youtube.com/live2/your-stream-key live=1\'');

  pipeline.play();
  return pipeline;
}

io.on('connection', (socket) => {
  console.log('Client connected');
  let pipeline;

  socket.on('stream', (byte) => {
    console.log(`byte received >>>>> ${byte.length}`);
    if (!pipeline) {
      pipeline = createGStreamerPipeline();
    }

    if (pipeline) {
      // Retrieve the appsrc element from the pipeline
      const appsrc = pipeline.getChildByName('source');
      // Push the byte array into the appsrc element
      appsrc.push(Buffer.from(byte));
      console.log('Bytes pushed');
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
    if (pipeline) {
      pipeline.stop();
      pipeline = null;
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT} `));
