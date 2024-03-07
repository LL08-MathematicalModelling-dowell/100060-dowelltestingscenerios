const io = require('socket.io')(server);
const gst = require('gstreamer-superficial');

// Function to create a GStreamer pipeline
function createGStreamerPipeline() {
  let pipeline = new gst.Pipeline(`appsrc name=source ! videoconvert ! x264enc bitrate=3000 ! flvmux ! rtmpsink location='rtmp://a.rtmp.youtube.com/live2/your-stream-key live=1'`);

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
      let appsrc = pipeline.getChildByName('source');
      // Push the byte array into the appsrc element
      appsrc.push(Buffer.from(byte));
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
