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



// Function to create a GStreamer pipeline

// function createGStreamerPipeline(rtmpUrl) {
//   // Define caps string for raw H.264 video stream.
//   const caps = 'video/x-h264, stream-format=(string)byte-stream, alignment=(string)au, profile=(string)baseline';

//   // Construct the GStreamer pipeline with the adjusted caps for appsrc
//   const pipeline = new gst.Pipeline(`appsrc name=source caps=${caps} ! queue ! videoconvert ! x264enc bitrate=3000 tune=zerolatency ! flvmux streamable=true ! rtmpsink location='${rtmpUrl} live=1'`);

  // const pipeline = new gst.Pipeline(`appsrc name=source ! videoconvert ! x264enc bitrate=3000 ! flvmux ! rtmpsink location=${rtmpUrl}`);
  // const pipeline = new gst.Pipeline(`appsrc name=source ! videoconvert ! x264enc bitrate=3000 ! flvmux ! rtmpsink location='${rtmpUrl} live=1'`);

  // est Locally First: Before streaming to YouTube, test the 
  // pipeline locally by saving to a file instead of streaming to RTMP.
  //  Replace flvmux ! rtmpsink location=... with flvmux ! filesink location=test.flv to see 
  // if the pipeline works as expected with your video data.
// function createGStreamerPipeline(rtmpUrl) {
//   const caps = 'video/x-h264, stream-format=(string)byte-stream, alignment=(string)au, profile=(string)baseline';
//   // Notice no additional single quotes around ${caps}
//   const pipelineStr = `appsrc name=source is-live=true caps=${caps} ! queue ! videoconvert ! x264enc bitrate=3000 tune=zerolatency ! flvmux streamable=true ! rtmpsink location='${rtmpUrl} live=1'`;  
//   const pipeline = new gst.Pipeline(pipelineStr);

//   console.log('Pipeline created');

//   pipeline.play();

//   console.log('pipeline played');

//   return pipeline;
// }

//   console.log('Pipeline created');

//   pipeline.play();

//   console.log('pipeline played');
//   return pipeline;
// }

// io.on('connection', (socket) => {
//   console.log('Client connected');
//   let pipeline;
//   let rtmpUrl; // This will hold the RTMP URL received from the client

//   socket.on('rtmpUrl', (data) => {
//     rtmpUrl = data.rtmpUrl;
//     console.log(`Received new RTMP URL: ${rtmpUrl}`);
//   });

//   socket.on('stream', (byte) => {
//     if (!pipeline && rtmpUrl) {
//       console.log(`Creating pipeline with RTMP URL: ${rtmpUrl}`);
//       pipeline = createGStreamerPipeline(rtmpUrl);
//     }

//     if (pipeline) {
//       // Retrieve the appsrc element from the pipeline
//       const appsrc = pipeline.findChild('source');
//       // Push the byte array into the appsrc element

//       console.log('apsrc created ==> ', appsrc);
//       appsrc.push(Buffer.from(byte));
//       console.log('Bytes pushed');
//     }
//   });

//   socket.on('disconnect', () => {
//     console.log('Client disconnected');
//     if (pipeline) {
//       pipeline.stop();
//       pipeline = null;
//     }
//   });
// });


// // Function to create a GStreamer pipeline
// function createGStreamerPipeline(newRtmpUrl) {
//   const pipeline = new gst.Pipeline(`appsrc name=source ! videoconvert ! x264enc bitrate=3000 ! flvmux ! rtmpsink location='${newRtmpUrl} live=1'`);

//   pipeline.play();
//   return pipeline;
// }

// io.on('connection', (socket) => {
//   console.log('Client connected');
//   let pipeline;
//   let newRtmpUrl; // This will hold the RTMP URL received from the client

//   socket.on('rtmpUrl', (data) => {
//     newRtmpUrl = data.newRtmpUrl;
//     console.log(`Received new RTMP URL: ${newRtmpUrl}`);
//   });

//   socket.on('stream', (byte) => {
//     if (!pipeline && newRtmpUrl) {
//       console.log(`Creating pipeline with RTMP URL: ${newRtmpUrl}`);
//       pipeline = createGStreamerPipeline(newRtmpUrl);
//     }

//     if (pipeline) {
//       // Retrieve the appsrc element from the pipeline
//       const appsrc = pipeline.getChildByName('source');
//       // Push the byte array into the appsrc element
//       appsrc.push(Buffer.from(byte));
//       console.log('Bytes pushed');
//     }
//   });

//   socket.on('disconnect', () => {
//     console.log('Client disconnected');
//     if (pipeline) {
//       pipeline.stop();
//       pipeline = null;
//     }
//   });
// });


const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT} `));




// io.on('connection', (socket) => {
//   console.log('Client connected');
//   let pipelineProcess;

//   socket.on('rtmpUrl', (data) => {
//     if (!pipelineProcess) { // Prevent creating multiple pipelines for the same client
//       const { newRtmpUrl } = data;
//       console.log(`Creating pipeline with RTMP URL: ${newRtmpUrl}`);
//       pipelineProcess = createGStreamerPipeline(newRtmpUrl);
//     }
//   });

//   socket.on('stream', (byte) => {
//     if (!pipeline && newRtmpUrl) {
//       console.log(`Creating pipeline with RTMP URL: ${newRtmpUrl}`);
//       pipeline = createGStreamerPipeline(newRtmpUrl);
//     }

//     if (pipeline) {
//       // Retrieve the appsrc element from the pipeline
//       const appsrc = pipeline.getChildByName('source');
//       // Push the byte array into the appsrc element
//       appsrc.push(Buffer.from(byte));
//       console.log('Bytes pushed');
//     }
//   });

//   socket.on('disconnect', () => {
//     console.log('Client disconnected');
//     if (pipelineProcess) {
//       pipelineProcess.kill(); // Terminate the GStreamer pipeline process
//       pipelineProcess = null;
//     }
//   });
// });

// io.on('connection', (socket) => {
//   console.log('Client connected');
//   let pipeline;
  // let newRtmpUrl; // This will hold the RTMP URL received from the client

  // socket.on('rtmpUrl', (data) => {
  //   newRtmpUrl = data.newRtmpUrl;
  //   console.log(`Received new RTMP URL: ${newRtmpUrl}`);
  // });

//   socket.on('stream', (byte) => {
//     console.log('bytes recieved');
//     if (!pipeline && newRtmpUrl) {
//       console.log(`Creating pipeline with RTMP URL: ${newRtmpUrl}`);
//       pipeline = createGStreamerPipeline(newRtmpUrl);
//     }

//     if (pipeline) {
//       // Retrieve the appsrc element from the pipeline
//       const appsrc = pipeline.findChild('source');
//       // Push the byte array into the appsrc element
//       appsrc.push(Buffer.from(byte));
//       console.log('Bytes pushed');
//     }
//   });

//   socket.on('disconnect', () => {
//     console.log('Client disconnected');
//     if (pipeline) {
//       pipeline.stop();
//       pipeline = null;
//     }
//   });
// });



// Function to create and start a GStreamer pipeline using child_process
// function createGStreamerPipeline(newRtmpUrl) {
//   const command = 'gst-launch-1.0';
//   const args = [
//     'appsrc', 'name=source', 'do-timestamp=true',
//     '!', 'videoconvert',
//     '!', 'x264enc', 'bitrate=3000', 'key-int-max=60', 'speed-preset=ultrafast', 'tune=zerolatency',
//     '!', 'flvmux', 'streamable=true',
//     '!', 'rtmpsink', `location='${newRtmpUrl}'`,
//   ];

//   const pipelineProcess = spawn(command, args);

//   pipelineProcess.stdout.on('data', (data) => {
//     console.log(`stdout: ${data}`);
//   });

//   pipelineProcess.stderr.on('data', (data) => {
//     console.error(`stderr: ${data}`);
//   });

//   pipelineProcess.on('close', (code) => {
//     console.log(`GStreamer pipeline exited with code ${code}`);
//   });

//   return pipelineProcess;
// }

// // Function to create a GStreamer pipeline
function createGStreamerPipeline(newRtmpUrl) {
  console.log('creating pipeline');
  const pipeline = new gst.Pipeline(`appsrc name=source ! videoconvert ! x264enc bitrate=3000 ! flvmux ! rtmpsink location='${newRtmpUrl} live=1'`);

  pipeline.play();
  console.log('pipeline created');
  return pipeline;
}




// io.on('connection', (socket) => {
//   console.log('Client connected');

//   let command; // This will reference the FFmpeg process

//   socket.on('rtmpUrl', (data) => {
//     const rtmpUrl = data.rtmpUrl;
//     console.log(`Received new RTMP URL: ${rtmpUrl}`);

//     // Initialize FFmpeg command if not already running
//     if (!command) {
//       command = ffmpeg()
//         .input('-') // Input from stdin
//         .inputFormat('webm') // Assuming the client sends WebM; adjust as necessary
//         .outputOptions([
//           '-c copy', // Copy codecs without re-encoding
//           '-f flv' // Output format compatible with RTMP
//         ])
//         .output(rtmpUrl) // Output to the RTMP URL
//         .on('start', (commandLine) => {
//           console.log(`Spawned Ffmpeg with command: ${commandLine}`);
//         })
//         .on('error', (err, stdout, stderr) => {
//           console.error('FFmpeg Error:', err.message);
//           console.log('FFmpeg stdout:\n', stdout);
//           console.log('FFmpeg stderr:\n', stderr);
//         })
//         .on('end', () => {
//           console.log('Streaming finished');
//           command = null; // Reset command after streaming ends
//         })
//         .run();
//     } else {
//       console.log('FFmpeg process is already running.');
//     }
//   });

//   socket.on('stream', (byteBuffer) => {
//     console.log('XXXXXXX Command X===>>> ', command);
//     if (command) {
//       command.stdin.write(byteBuffer);
//     } else {
//       console.log('FFmpeg command not initialized. Ignoring stream data.');
//     }
//   });

//   socket.on('disconnect', () => {
//     console.log('Client disconnected');
//     if (command) {
//       command.kill('SIGINT');
//       command = null; // Ensure command is reset for the next connection
//     }
//   });
// });




// class StreamSession {
//   constructor(socket) {
//     this.socket = socket;
//     this.command = null;
//     this.initListeners();
//     console.log('StreamSession instance created');
//   }

//   initListeners() {
//     this.socket.on('rtmpUrl', (data) => this.handleRtmpUrl(data));
//     this.socket.on('stream', (byteBuffer) => this.handleStream(byteBuffer));
//     this.socket.on('disconnect', () => this.handleDisconnect());
//   }

//   handleRtmpUrl(data) {
//     const rtmpUrl = data.rtmpUrl;
//     console.log(`Received new RTMP URL: ${rtmpUrl}`);

//     if (!this.command) {
//       console.log('Initializing FFmpeg command...');
//       this.command = ffmpeg()
//         .input('-')
//         .inputFormat('webm')
//         .outputOptions(['-c copy', '-f flv'])
//         .output(rtmpUrl)
//         .on('start', (commandLine) => {
//           console.log(`Spawned FFmpeg with command: ${commandLine}`);
//           this.socket.emit('ffmpegReady'); // Notify client that FFmpeg is ready
//           console.log('ffmpeg ready emitted');
//         })
//         .on('error', (err) => {
//           console.error('FFmpeg Error:', err.message);
//           this.command = null; // Ensure command is reset on error
//         })
//         .on('end', () => {
//           console.log('Streaming finished');
//           this.command = null; // Reset command after streaming ends
//         })
//         .run();

//     } else {
//       console.log('FFmpeg process is already running.');
//     }
//   }

//   handleStream(byteBuffer) {
//     console.log('Attempting to write to FFmpeg stdin...');
//     if (this.command) {
//       console.log('Writing data to FFmpeg stdin');
//       this.command.stdin.write(byteBuffer);
//     } else {
//       console.log('FFmpeg command not initialized. Ignoring stream data.');
//     }
//   }

//   handleDisconnect() {
//     console.log('Client disconnected. Cleaning up...');
//     if (this.command) {
//       this.command.kill('SIGINT');
//       this.command = null; // Ensure command is reset for the next connection
//     }
//   }
// }


// // When a new client connects, create a new StreamSession instance for that client
// io.on('connection', (socket) => {
//   console.log('Client connected');
//   new StreamSession(socket);
// });

// def start_ffmpeg_process(self):
// try:
//     command = self.generate_ffmpeg_command()
//     self.process = subprocess.Popen(
//         command, stdin=subprocess.PIPE,
//         stdout=subprocess.PIPE,
//         stderr=subprocess.PIPE,
//     )
// except Exception as e:
//     print("Error starting FFmpeg process: ", e)

// def generate_ffmpeg_command(self):

// common_options = [
//     'ffmpeg',
//     '-vcodec', 'copy',
//     '-acodec', 'aac',
//     '-f', 'flv',
//     '-preset', 'ultrafast',
//     '-tune', 'zerolatency',  # Enable zerolatency tuning
//     self.rtmp_url,
// ]

// if not self.audio_enabled:
//     return common_options + [
//         '-f', 'lavfi', '-i', 'anullsrc',
//         '-i', '-',
//         '-shortest',
//     ]

// return common_options + ['-i', '-']
