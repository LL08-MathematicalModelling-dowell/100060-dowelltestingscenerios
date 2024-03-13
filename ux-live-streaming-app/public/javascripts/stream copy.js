let mediaRecorder; // Declare mediaRecorder variable

// Function to set preview for video element
function setPreview(stream) {
  const videoElement = document.getElementById('preview');
  videoElement.srcObject = stream;
}

const socket = io();
// Function to handle getting media streams using WebRTC
async function getMedia(type) {
  const audio = true;
  const mediaData = [];
  // const socket = io(); // Establish connection to server
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

    mediaRecorder = new MediaRecorder(stream);

    // Inside getMedia function, modify the mediaRecorder setup
    mediaRecorder.ondataavailable = (e) => {
      mediaData.push(e.data);
      if (socket) {
        const reader = new FileReader();
        reader.onload = function () {
          const arrayBuffer = reader.result;
          socket.emit('stream', new Uint8Array(arrayBuffer));
        };
        reader.readAsArrayBuffer(e.data);
      }
    };

    mediaRecorder.start();

    mediaRecorder.onstop = () => {
      document.getElementById('preview').srcObject = null; // Clear preview
      const recordedBlob = new Blob(mediaData, { type: mediaData[0].type });
      const recordedUrl = URL.createObjectURL(recordedBlob);
      document.getElementById('preview').src = recordedUrl;
    };
  } catch (error) {
    console.error('Error getting media:', error);
  }
}

// Function to stop media streams
async function stopMedia() {
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

// Event listeners for buttons
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('screen').addEventListener('click', () => getMedia('screen'));
  document.getElementById('camera').addEventListener('click', () => getMedia('camera'));
  document.getElementById('both').addEventListener('click', () => getMedia('both'));
  document.getElementById('stop-btn').addEventListener('click', () => stopMedia());
});

// XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXx
// XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
let rtmpUrl;
async function startBroadcast(videoPrivacyStatus, videoTitle, playlistId) {
  const response = await fetch('/startBroadcast', {
    method: 'POST', // HTTP method
    headers: {
      'Content-Type': 'application/json', // Indicating the type of content being sent
      // Include other headers as necessary, e.g., for CSRF protection
    },
    body: JSON.stringify({
      videoPrivacyStatus,
      videoTitle,
      playlistId,
    }),
  });

  if (!response.ok) {
    // Handle HTTP errors
    const errorMessage = await response.text();
    console.error('Failed to start broadcast:', errorMessage);
    throw new Error('Failed to start broadcast');
  }

  // Parse and use the JSON response
  const result = await response.json();
  rtmpUrl = result.newRtmpUrl;
  console.log('Broadcast started successfully:', rtmpUrl);
  // Use the result as needed
}

// Example usage
document.addEventListener('DOMContentLoaded', () => {
  const videoPrivacyStatus = 'private'; // or 'public', 'unlisted'
  const videoTitle = 'My Awesome Live Stream';
  const playlistId = 'PLnHd_LVqZUfFHWMlgkzvrKRvWlxTF5hR4'; // Assuming you have a playlist ID

  // Call startBroadcast with the desired parameters
  startBroadcast(videoPrivacyStatus, videoTitle, playlistId)
    .then(() => console.log('Broadcast setup initiated successfully.'))
    .catch((error) => console.error('Error starting broadcast:', error));
});




