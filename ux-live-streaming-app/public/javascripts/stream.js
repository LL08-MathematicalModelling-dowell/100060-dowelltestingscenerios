let mediaRecorder; // Declare mediaRecorder variable
let rtmpUrl = null; // RTMP URL from the server
let ffmpegReady = false;
// Function to set preview for video element
function setPreview(stream) {
  const videoElement = document.getElementById('preview');
  videoElement.srcObject = stream;
}

// Establish connection to server
const socket = io(); // Global socket connection

socket.on('ffmpegReady', () => {
  console.log('ffmpeg is ready...');
  ffmpegReady = true;
});

async function startBroadcast(videoPrivacyStatus, videoTitle, playlistId) {
  // Fetch request to start the broadcast and get the RTMP URL
  try {
    const response = await fetch('/startBroadcast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoPrivacyStatus, videoTitle, playlistId }),
    });

    if (!response.ok) {
      throw new Error(JSON.stringify(response));
    }

    const { newRtmpUrl } = await response.json();
    console.log('Broadcast started successfully:', newRtmpUrl);

    // rtmpUrl = newRtmpUrl;
    return newRtmpUrl;
  } catch (error) {
    console.error(error);
    alert('Failed to start the broadcast. Check console for details.');
    return null;
  }
}

async function getMedia(type) {
  if (!rtmpUrl) {
    console.log('RTMP URL is not set. Starting broadcast first.');
    rtmpUrl = await startBroadcast('private', 'My Awesome Live Stream', 'PLnHd_LVqZUfFHWMlgkzvrKRvWlxTF5hR4');
    if (!rtmpUrl) {
      console.log('broadcast not created, sockect closed');
      return;
    }
    if (rtmpUrl && socket) {
      console.log('sending rtmpurl ==>> ', rtmpUrl);
      socket.emit('rtmpUrl', { rtmpUrl });
    }
  }

  const audio = true;
  const mediaData = [];

  try {
    let stream;
    if (type === 'screen') {
      stream = await navigator.mediaDevices.getDisplayMedia({ video: { cursor: 'always' }, audio });
    } else if (type === 'camera') {
      stream = await navigator.mediaDevices.getUserMedia({ video: true, audio });
    } else if (type === 'both') {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: { cursor: 'always' }, audio });
      const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true, audio });
      const screenTrack = screenStream.getVideoTracks()[0];
      const cameraTrack = cameraStream.getVideoTracks()[0];
      const audioTrack = cameraStream.getAudioTracks()[0];
      stream = new MediaStream([screenTrack, cameraTrack, audioTrack]);
    }
    setPreview(stream);
    mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm; codecs=h264' });

    console.log('XXXXXXXXXXXXXXXXXX MEDIA RECORDER CREATED XXXXXXXXXXXXXXXX');

    // mediaRecorder.ondataavailable event handler to send data to the server
    mediaRecorder.ondataavailable = function (event) {
      if ((event.data && event.data.size > 0) && rtmpUrl) {
        event.data.arrayBuffer().then((arrayBuffer) => {
          const buffer = new Uint8Array(arrayBuffer);
          console.log('Byte sent...');
          socket.emit('stream', buffer);
        });
      }
    };

    mediaRecorder.ondataavailable = (event) => {
      console.log('dataavailable: ===> ', rtmpUrl);
      if (event.data.size > 0 && rtmpUrl !== null) {
        // console.log(`stream byte ====>>> ${event.data}`);

        mediaData.push(event.data);

        // Convert Blob to ArrayBuffer
        // event.data.arrayBuffer().then((arrayBuffer) => {
        //   const buffer = new Uint8Array(arrayBuffer);
        socket.emit('stream', event.data);
        // });
      }
    };

    mediaRecorder.onstop = () => {
      document.getElementById('preview').srcObject = null; // Clear preview
      const recordedBlob = new Blob(mediaData, { type: mediaData[0].type });
      const recordedUrl = URL.createObjectURL(recordedBlob);
      document.getElementById('preview').src = recordedUrl;
    };

    if (ffmpegReady === true) {
      mediaRecorder.start(1000);
    }
  } catch (error) {
    console.error('Error getting media:', error);
    alert('Failed to get media. Check console for details.');
  }
}

function stopMedia() {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
  }
  const videoElement = document.getElementById('preview');
  const stream = videoElement.srcObject;
  if (stream) {
    const tracks = stream.getTracks();
    tracks.forEach((track) => track.stop());
    videoElement.srcObject = null;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('screen').addEventListener('click', () => getMedia('screen'));
  document.getElementById('camera').addEventListener('click', () => getMedia('camera'));
  document.getElementById('both').addEventListener('click', () => getMedia('both'));
  document.getElementById('stop-btn').addEventListener('click', stopMedia);
});
