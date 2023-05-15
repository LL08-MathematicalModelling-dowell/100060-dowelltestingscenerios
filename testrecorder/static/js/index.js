// Some app controls
const video = document.getElementById('video')
const cameraCheckbox = document.getElementById('webcam-recording')
const screenCheckbox = document.getElementById('screen-recording')
let switchCamera = document.querySelector(".switch-btn")
//const keyLogCheckbox = document.getElementById('key-logging')
//const audioCheckbox = document.getElementById('audio-settings')
const publicVideosCheckbox = document.getElementById('public-videos')
const privateVideosCheckbox = document.getElementById('private-videos')
const selectCamerabutton = document.getElementById('choose-camera');
const selectVideo = document.getElementById('video-source');
let currentStream;

let usernameValue = null;
let testNameValue = null;
let testDescriptionValue = null;
let screenRecorderChunks = [];
let webcamChunks = [];
let mergedStreamChunks = [];
let testRecordingData = null;
let screenRecorder = null;
let mergedStreamRecorder = null;
let webcamRecorder = null
let webCamStream = null;
let screenStream = null;
let audioStream = null;
let currentCamera = "user";
// let videoConstraints = {};
let videoConstraints = {
    facingMode: currentCamera
};
// if (selectVideo.value === '') {
//   videoConstraints.facingMode = 'environment';
// } else {
//   videoConstraints.deviceId = { exact: selectVideo.value };
// }
// let webcamMediaConstraints = {
//   video: videoConstraints, audio: true
// };
let webcamMediaConstraints = null;
let screenAudioConstraints = {
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    sampleRate: 44100
  },
  video: false
};
 let recordingSynched = false;
 let fileRandomString = "qwerty";
 let appWebsocket = null;
 let webcamWebSocket = null;
 let screenWebSocket = null;
 let streamWebcamToYT = false;
 let streamScreenToYT = false;
 let streamMergedToYT = false;
 let newBroadcastID = null;
 let websocketReconnect = false;
 let newRtmpUrl = null;
 let recordinginProgress = false;
 let videoPrivacyStatus = "private";
 let lastMsgRcvTime = 0;
 let msgRcvdFlag = false;
 let networkTimer = false;
 let filesTimestamp = null;
 let screenFileName = null;
 let webcamFileName = null;
 let taskIdWebSocket = null;
 let receivedTaskID = [];
 let taskIDwasRreceived = false;
 let faultyTaskID = null; // Bad clickup task or task id
 let currentRadioButtonID = null;
 let userPlaylists = null;
 let userPlaylistSelection = null;
 let channelTitle = null;
 let todaysPlaylistId = null;
 let webcamStreamHeight = null;
 let webcamStreamWidth = null;
 let currentChannelTitle = null;
 let showNotificationPermission = 'default';

// Some app controls

let appWebsocket = null;
let webcamWebSocket = null;
let screenWebSocket = null;
let streamWebcamToYT = false;
let streamScreenToYT = false;
let streamMergedToYT = false;
let newBroadcastID = null;
let newRtmpUrl = null;
let websocketReconnect = false;
let recordinginProgress = false;
let videoPrivacyStatus = "unlisted";
let lastMsgRcvTime = 0;
let msgRcvdFlag = false;
let networkTimer = false;
let filesTimestamp = null;
let screenFileName = null;
let webcamFileName = null;
let taskIdWebSocket = null;
let receivedTaskID = [];
//let receivedTaskID = ["3703820","33k9h43","33k9h43D"];
let taskIDwasRreceived = false;
let faultyTaskID = null; // Bad clickup task or task id
let currentRadioButtonID = null;
let userPlaylists = null;
let userPlaylistSelection = null;
let channelTitle = null;
let todaysPlaylistId = null;
let tablePlaylists = [];
// channels global Variables
let userChannelSelection = null;
let tableChannels = [];
let defaultChannel = 'UX Live from uxlivinglab';
let currentChannelTitle = null;
let showNotificationPermission = 'default';



// // App global variables
// let usernameValue = null;
// let testNameValue = null;
// let testDescriptionValue = null;
// let screenRecorderChunks = [];
// let webcamChunks = [];
// let mergedStreamChunks = [];
// let testRecordingData = null;
// let screenRecorder = null;
// let mergedStreamRecorder = null;
// let webcamRecorder = null
// let webCamStream = null;
// let screenStream = null;
// let audioStream = null;
// let videoConstraints = {};
// let webcamMediaConstraints = null;
// let screenAudioConstraints = {
//   audio: {
//     echoCancellation: true,
//     noiseSuppression: true,
//     sampleRate: 44100
//   },
//   video: false
// };
// let recordingSynched = false;

// let fileRandomString = "qwerty";

// let appWebsocket = null;
// let webcamWebSocket = null;
// let screenWebSocket = null;
// let streamWebcamToYT = false;
// let streamScreenToYT = false;
// let streamMergedToYT = false;
// let newBroadcastID = null;
// let websocketReconnect = false;
// let newRtmpUrl = null;
// let recordinginProgress = false;
// let videoPrivacyStatus = "private";
// let lastMsgRcvTime = 0;
// let msgRcvdFlag = false;
// let networkTimer = false;
// let filesTimestamp = null;
// let screenFileName = null;
// let webcamFileName = null;
// let taskIdWebSocket = null;
// let receivedTaskID = [];
// let taskIDwasRreceived = false;
// let faultyTaskID = null; // Bad clickup task or task id
// let currentRadioButtonID = null;
// let userPlaylists = null;
// let userPlaylistSelection = null;
// let channelTitle = null;
// let todaysPlaylistId = null;
// let webcamStreamHeight = null;
// let webcamStreamWidth = null;
// let currentChannelTitle = null;
// let showNotificationPermission = 'default';

const shareLink = new ShareLink(newBroadcastID);

// video timer
let videoTimer = document.querySelector(".video-timer")
let switchCamBtn = document.querySelector(".switch-btn")
let hourTime = document.querySelector(".hour-time")
let minuteTime = document.querySelector(".minute-time")
let secondTime = document.querySelector(".second-time")
let timeInterval;
let totalTime = 0;



function displayTimer() {
  videoTimer.classList.add("show-cam-timer")
  switchCamBtn.classList.add("show-cam-timer")
  timeInterval = setInterval(setTime, 1000);
  if (totalTime > 0) {
    totalTime = 0
  }
}

async function clearTimer() {
  videoTimer.classList.add("show-cam-timer")
  clearInterval(timeInterval);
}

function setTime() {
  ++totalTime;
  secondTime.innerHTML = calcTime(totalTime % 60);
  minuteTime.innerHTML = calcTime(parseInt(totalTime / 60));
  hourTime.innerHTML = calcTime(parseInt(totalTime / 3600));
}
function calcTime(val) {
  let valString = val + "";
  if (valString.length
    < 2) {
    return "0" + valString;
  } else {
    return valString;
  }
}
// diasble unlist if public is checked
function disablePrivate(){
  let publicChecked = publicVideosCheckbox.checked;
  let unlistChecked = privateVideosCheckbox.checked;
  if (publicChecked == true) {
    unlistChecked == false
    if (unlistChecked == true) {
      privateVideosCheckbox.click()
    }
  } 
}
// diasble public if unlist is checked
function disablePublic() {
  let publicChecked = publicVideosCheckbox.checked;
  let privateChecked = privateVideosCheckbox.checked;
  if (privateChecked == true) {
    publicChecked == false
    if (publicChecked == true) {
      publicVideosCheckbox.click()
    }
  }
}

// switch camera button
switchCamera.addEventListener("click", () => {
  currentCamera = currentCamera === "user" ? "environment" : "user";
  video.srcObject.getTracks().forEach(track => track.stop());
  videoConstraints = {
    facingMode: currentCamera
  };
  webcamMediaConstraints = {
    video: videoConstraints, audio: true
  };
  console.log(videoConstraints.facingMode);

  // console.log(currentCamera);
  navigator.mediaDevices
    .getUserMedia(webcamMediaConstraints)
    .then(stream => {
      currentStream = stream;
      video.srcObject = stream;
      return stream;
    })
    .catch(error => {
      console.log("Error getting the camera: ", error);
    })
})

// display user
let userIcon = document.querySelector(".user-icon")
let userDisplay = document.querySelector(".user-display")

userIcon.addEventListener("click", function () {
  userDisplay.classList.toggle("show-user-bar")
})

// Generate random string for appending to file name
generateString(6).then((randomString) => {
  fileRandomString = randomString;
})

// Fill user email settings if it exists
document.getElementById("userClickupEmail").value = localStorage.getItem("userClickupEmail");


// show select camera modal
async function showCameraModal() {
  const cameraCheckbox = document.getElementById('webcam-recording');
  let webCam = cameraCheckbox.checked;
  if (webCam == true) {
    // close modal if open
    const btnCloseCameraModal = document.getElementById('closecameraModal');
    btnCloseCameraModal.click();

    // Show modal
    const showCamera = new bootstrap.Modal(document.getElementById('cameraModal'));
    showCamera.show();
  } else {
    // Show modal
    const showCamera = new bootstrap.Modal(document.getElementById('cameraModal'));
    showCamera.hide();
  }

}
function stopMediaTracks(stream) {
  stream.getTracks().forEach(track => {
    track.stop();
  });
}

// async function gotDevices(mediaDevices) {
//   selectVideo.innerHTML = '';
//   selectVideo.appendChild(document.createElement('option'));
//   let count = 1;
//   mediaDevices.forEach(mediaDevice => {
//     if (mediaDevice.kind === 'videoinput') {
//       const option = document.createElement('option');
//       option.value = mediaDevice.deviceId;
//       const label = mediaDevice.label || `Camera ${count++}`;
//       const textNode = document.createTextNode(label);
//       option.appendChild(textNode);
//       selectVideo.appendChild(option);
//     }
//   });
// }
// navigator.mediaDevices.enumerateDevices().then(gotDevices);

selectCamerabutton.addEventListener('click', event => {
  if (typeof currentStream !== 'undefined') {
    stopMediaTracks(currentStream);
  }
  const videoConstraints = {};
  if (selectVideo.value === 'environment') {
    videoConstraints.facingMode = 'environment';
  } else if (selectVideo.value === 'user'){
    videoConstraints.facingMode = 'user';
  }else {
    videoConstraints.facingMode = 'user';
    // videoConstraints.deviceId = { exact: selectVideo.value };
  }
  webcamMediaConstraints = {
    video: videoConstraints,
    audio: true
  };
  navigator.mediaDevices
    .getUserMedia(webcamMediaConstraints)
    .then(stream => {
      currentStream = stream;
      video.srcObject = stream;
      return stream;
    })
    .catch(error => {
      console.error(error);
    });
});



// Gets webcam stream
async function captureMediaDevices(currentMediaConstraints) {
  try {
    const stream = await navigator.mediaDevices.getUserMedia(currentMediaConstraints)

    video.src = null
    video.srcObject = stream
    video.muted = true

    return stream
  }
  catch (err) {
    let msg = "STATUS: Error while getting webcam stream."
    document.getElementById("app-status").innerHTML = msg;
    // Reset app status
    await resetStateOnError();
    alert("Error while getting webcam stream!\n -Please give permission to webcam or mic when requested.\n -Try to start the recording again.");
  }
}

async function captureScreen(mediaConstraints = {
  video: {
    cursor: 'always',
    resizeMode: 'crop-and-scale'
  },
  // audio: true
}
) {

  try {
    let screenStream;

    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      // Use getUserMedia for mobile devices
      screenStream = await navigator.mediaDevices.getUserMedia(mediaConstraints);
    } else {
      // Use getDisplayMedia for desktop devices
      screenStream = await navigator.mediaDevices.getDisplayMedia(mediaConstraints);
    }

    return screenStream;
  }
  catch (err) {
    let msg = "STATUS: Error while getting screen stream."
    document.getElementById("app-status").innerHTML = msg;
    alert("Error while getting screen stream!\n -Please share screen when requested.\n -Try to start the recording again.");
    // Tell user, stop the recording.
    resetStateOnError();
  }
}

//@Muhammad Ahmed 
// VOice mute/Unmute

async function microphoneStatus() {
  var microphoen_btn = null;
  microphoen_btn = document.getElementById("audio-settings");
  if (microphoen_btn.checked == true) {
    return microphoen_btn = true;
  } else {
    return microphoen_btn = false;
  }
}



// Records webcam and audio
async function recordStream() {
  // webCamStream = await getAllCamera();
  const cameraCheckbox = document.getElementById('webcam-recording');
  const screenCheckbox = document.getElementById('screen-recording');
  webCamStream = await captureMediaDevices(webcamMediaConstraints);
  console.log(webcamMediaConstraints);

  video.src = null
  video.srcObject = webCamStream
  video.muted = true

  let options = await getSupportedMediaType();

  if (options === null) {
    alert("None of the required codecs was found!\n - Please update your browser and try again.");
    document.location.reload();
  }

  webcamRecorder = new MediaRecorder(webCamStream, options);

  webcamRecorder.ondataavailable = event => {
    if (recordinginProgress == true) {
      if ((event.data.size > 0) && (recordingSynched == true) && (streamWebcamToYT == true)) {
        appWebsocket.send(event.data);
      } else if ((event.data.size > 0) && (recordingSynched == true) && (streamScreenToYT == false)) {
        // console.log("Sending screen data to webcam websocket");
        let recordWebcam = cameraCheckbox.checked;
        let recordScreen = screenCheckbox.checked;
        if ((recordScreen == true) && (recordWebcam == true)) {
          webcamWebSocket.send(event.data);
        }
      }
    }
  }

  webcamRecorder.onstop = () => {
    // Show that webcam recording has stopped
    msg = "STATUS: Webcam Recording stopped."
    document.getElementById("app-status").innerHTML = msg;
  }

  //webcamRecorder.start(200)
}

/** ======= Not Used ==========
 * Internal Polyfill to simulate
 * window.requestAnimationFrame
 * since the browser will kill canvas
 * drawing when tab is inactive
 */
const requestVideoFrame = function (callback) {
  // ================================== Function Not Implemented Yet ==============================
  return window.setTimeout(function () {
    callback(Date.now());
  }, 1000 / 60); // 60 fps - just like requestAnimationFrame
};

/**
 * Internal polyfill to simulate
 * window.cancelAnimationFrame
 */
const cancelVideoFrame = function (id) {
  //===============================  Function is Not Implemented Yet =========================================
  clearTimeout(id);
};

// make composite

// async function makeComposite() {
//   if (webCamStream && screenStream) {
//     canvasCtx.save();
//     canvasElement.setAttribute("width", `${screenStream.videoWidth}px`);
//     canvasElement.setAttribute("height", `${screenStream.videoHeight}px`);
//     canvasCtx.clearRect(0, 0, screenStream.videoWidth, screenStream.videoHeight);
//     canvasCtx.drawImage(screenStream, 0, 0, screenStream.videoWidth, screenStream.videoHeight);
//     canvasCtx.drawImage(
//       cam,
//       0,
//       Math.floor(screenStream.videoHeight - screenStream.videoHeight / 4),
//       Math.floor(screenStream.videoWidth / 4),
//       Math.floor(screenStream.videoHeight / 4)
//     ); // this is just a rough calculation to offset the webcam stream to bottom left
//     let imageData = canvasCtx.getImageData(
//       0,
//       0,
//       screenStream.videoWidth,
//       screenStream.videoHeight
//     ); // this makes it work
//     canvasCtx.putImageData(imageData, 0, 0); // properly on safari/webkit browsers too
//     canvasCtx.restore();
//     rafId = requestVideoFrame(makeComposite);
//   }
// }


// Records merged screen and webcam stream
async function recordMergedStream() {
  // ===================== Currently Funtion is Not being Used =======================================
  try {
    var merger = new VideoStreamMerger();

    // Set width and height of merger
    let screenWidth = merger.width;
    console.log(screenWidth);
    let screenHeight = merger.height;
    merger.setOutputSize(screenWidth, screenHeight);

    // Check if we need to add audio stream
    let recordAudio = await microphoneStatus();
    let muteState = !recordAudio;
    // console.log("muteState: ",muteState)

    // Add the screen capture. Position it to fill the whole stream (the default)
    merger.addStream(screenStream, {
      x: 0, // position of the topleft corner
      y: 0,
      width: merger.width,
      height: merger.height,
      //mute: true // we don't want sound from the screen (if there is any)
      //mute: false // we want sound from the screen (if there is any)
      mute: muteState // user preference on sound from the screen (if there is any)
    })

    // Calculate dynamic webcam stream height and width
    webcamStreamWidth = Math.floor(0.15 * screenWidth);
    // console.log("webcamStreamWidth: " + webcamStreamWidth);

    webcamStreamHeight = Math.floor((webcamStreamWidth * screenHeight) / screenWidth);
    // console.log("webcamStreamHeight: " + webcamStreamHeight);

    // Add the webcam stream. Position it on the bottom left and resize it to 0.15 of screen width.
    merger.addStream(webCamStream, {
      x: 0,
      y: merger.height - 100,
      width: 100,
      height: 100,
      // y: merger.height - webcamStreamHeight,
      // width: webcamStreamWidth,
      // height: webcamStreamHeight,
      mute: false
    })

    // Start the merging. Calling this makes the result available to us
    merger.start()

    // We now have a merged MediaStream!
    const mergedStream = merger.result
    let options = await getSupportedMediaType();

    if (options === null) {
      alert("None of the required codecs was found!\n - Please update your browser and try again.");
      document.location.reload();
    }

    // mergedStreamRecorder = new MediaRecorder(mergedStream, options);
    mergedStreamRecorder = new MediaRecorder(mergedStream, options);

    mergedStreamRecorder.ondataavailable = event => {
      if (recordinginProgress == true) {
        if ((event.data.size > 0) && (recordingSynched == true) && (streamMergedToYT == true)) {
          //mergedStreamChunks.push(event.data);
          appWebsocket.send(event.data);
        }
      }
    }

    webcamRecorder.onstop = () => {
      // Show that webcam recording has stopped
      let msg = "STATUS: Merged Stream Recording stopped."
      document.getElementById("app-status").innerHTML = msg;
    }

    //mergedStreamRecorder.start(200);
  }
  catch (err) {
    let msg = "STATUS: Error while recording merged stream stream."
    document.getElementById("app-status").innerHTML = msg;
    alert("Error while recording merged stream stream.");
    // console.log("Error while recording merged stream stream: " + err.message);

    // Reset app status
    resetStateOnError();
  }
}

// Stops webcam and screen recording
async function stopRecording() {
  const cameraCheckbox = document.getElementById('webcam-recording');
  const screenCheckbox = document.getElementById('screen-recording');
  // Stop network timer
  try {
    clearInterval(networkTimer);
  } catch (error) {
    console.error("Error while stopping network timer!");
  }
  // Close the websocket and stop streaming
  await stopStreamin();

  // Transition the broadcast to complete state
  await endBroadcast();
  await clearTimer()
  // Enable start recording button
  document.getElementById("start").disabled = false;
  resetonStartRecording()
  // Show upload in progress modal
  let uploadModal = new bootstrap.Modal(document.getElementById('uploadInProgress'));
  uploadModal.show();

  // Clear the progress bar
  let globalProgress = 0;
  await setProgressBarValue(globalProgress);

  // Check the settings
  let recordWebcam = cameraCheckbox.checked;
  let recordScreen = screenCheckbox.checked;
  //let logKeyboard = keyLogCheckbox.checked;
  let logKeyboard = false;

  // Initialize upload data object if null
  if (testRecordingData == null) {
    testRecordingData = new FormData();
  }

  // add the selected playlist information as an object
  if (userPlaylistSelection != null) {
    try {
      let Account_info = {
        'Channeltitle': channelTitle,
        'Playlist_title': userPlaylistSelection[currentRadioButtonID]
      }
      testRecordingData.set('Account_info', JSON.stringify(Account_info));
    } catch (error) {
      console.error("Error while adding Account_info to upload data.", error)
    }
  }

  // Set videos youtube links, or file names
  if ((recordScreen == true) && (recordWebcam == true)) {
    let youtubeLink = "https://youtu.be/" + newBroadcastID;
    testRecordingData.set('merged_webcam_screen_file', youtubeLink);
    testRecordingData.set('screen_file', screenFileName);
    testRecordingData.set('webcam_file', webcamFileName);
  } else if (recordScreen == true) {
    let youtubeLink = "https://youtu.be/" + newBroadcastID;
    testRecordingData.set('screen_file', youtubeLink);
  } else if (recordWebcam == true) {
    let youtubeLink = "https://youtu.be/" + newBroadcastID;
    testRecordingData.set('webcam_file', youtubeLink);
  }

  // Append test details data
  testRecordingData.set('user_name', usernameValue);
  testRecordingData.set('test_description', testDescriptionValue);
  testRecordingData.set('test_name', testNameValue);
  testRecordingData.set('user_files_timestamp', filesTimestamp);

  // Send data to server for storage
  sendAvailableData(globalProgress);
}

// Records screen and audio
async function recordScreenAndAudio() {
  screenStream = await captureScreen();
  const cameraCheckbox = document.getElementById('webcam-recording');
  const screenCheckbox = document.getElementById('screen-recording');

  // Check if we need to add audio stream
  let recordAudio = await microphoneStatus();

  let stream = null;
  if (recordAudio == true) {
    audioStream = await captureMediaDevices(screenAudioConstraints);
    //stream = new MediaStream([...screenStream.getTracks(), ...audioStream.getTracks()]);
    try {
      const mergeAudioStreams = (desktopStream, voiceStream) => {
        const context = new AudioContext();

        // Create a couple of sources
        const source1 = context.createMediaStreamSource(desktopStream);
        const source2 = context.createMediaStreamSource(voiceStream);
        const destination = context.createMediaStreamDestination();

        const desktopGain = context.createGain();
        const voiceGain = context.createGain();

        desktopGain.gain.value = 0.7;
        voiceGain.gain.value = 0.7;

        source1.connect(desktopGain).connect(destination);
        // Connect source2
        source2.connect(voiceGain).connect(destination);

        return destination.stream.getAudioTracks();
      };

      //stream = mergeAudioStreams;
      //stream = new MediaStream([...mergeAudioStreams.getTracks()]);
      const tracks = [
        ...screenStream.getVideoTracks(),
        ...mergeAudioStreams(screenStream, audioStream)
      ];

      // console.log('Tracks to add to stream', tracks);
      stream = new MediaStream(tracks);
    } catch (error) {
      console.error("Error while creating merged audio streams: ", error)
      stream = new MediaStream([
        ...screenStream.getTracks(),
        ...audioStream.getTracks()
      ]);
    }

  } else {
    stream = new MediaStream([...screenStream.getTracks()]);
    //stream = new MediaStream([...screenStream.getVideoTracks()]);
  }

  // Show screen record if webcam is not recording
  let recordWebcam = cameraCheckbox.checked;

  if (recordWebcam == false) {
    video.src = null
    video.srcObject = stream
    video.muted = true
  } else {
    video.src = null
    video.srcObject = webCamStream
    video.muted = true
  }

  let options = await getSupportedMediaType();
  if (options === null) {
    alert("None of the required codecs was found!\n - Please update your browser and try again.");
    document.location.reload();
  }

  screenRecorder = new MediaRecorder(stream, options);

  screenRecorder.ondataavailable = event => {
    //// // console.log("Data available");
    if (recordinginProgress == true) {
      if ((event.data.size > 0) && (recordingSynched == true) && (streamScreenToYT == true)) {
        appWebsocket.send(event.data);
      } else if ((event.data.size > 0) && (recordingSynched == true) && (streamScreenToYT == false)) {
        //// // console.log("Sending screen data to screen websocket");
        let recordWebcam = cameraCheckbox.checked;
        let recordScreen = screenCheckbox.checked;
        if ((recordScreen == true) && (recordWebcam == true)) {
          screenWebSocket.send(event.data);
        }
      }
    }
  }

  screenRecorder.onstop = () => {
    // Show that screen recording has stopped
    let msg = "STATUS: Screen Recording Stopped."
    document.getElementById("app-status").innerHTML = msg;
  }
}

// Muhammad Ahmed
// specific function for simultaneously share Cameras and  device screen  
async function camAndScreenShare() {
  const cameraCheckbox = document.getElementById('webcam-recording');
  const screenCheckbox = document.getElementById('screen-recording');
  try {
    screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
    // set up the screen capture stream

    // set up the camera stream
    // const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    webcamStreamWidth = 0;
    webcamStreamHeight = 0;
    const screenWidth = screen.width;
    const screenHeight = screen.height;

    if (cameraCheckbox.checked) {
      webcamStreamWidth = Math.floor(0.15 * screenWidth);
      webcamStreamHeight = Math.floor((webcamStreamWidth * screenHeight) / screenWidth);

      cameraStream = await navigator.mediaDevices.getUserMedia({ video: videoConstraints, audio: false });
    }
    //console.log("Camera stream dimensions: " + webcamStreamWidth + " x " + webcamStreamHeight);

    // create a canvas element to hold the merged stream
    const canvas = document.createElement('canvas');
    canvas.width = screenStream.width;
    canvas.height = screenStream.height;

    // set up the merger and add the streams
    const merger = new VideoStreamMerger();
    merger.addStream(screenStream, {
      x: 0,
      y: 0,
      width: merger.width,
      height: merger.height,
      mute: true
    });

    merger.addStream(cameraStream, {
      x: 0, // position of the top-left corner
      y: merger.height - webcamStreamHeight, // position of the bottom-left corner
      width: webcamStreamWidth,
      height: webcamStreamHeight,
      mute: true // we don't want sound from the camera

    });


    // start the merger
    merger.start();

    // set the video source to the merged stream
    video.srcObject = merger.result;
    const mergedStream = merger.result
    let options = await getSupportedMediaType();

    if (options === null) {
      alert("None of the required codecs was found!\n - Please update your browser and try again.");
      document.location.reload();
    }
    mergedStreamRecorder = new MediaRecorder(mergedStream, options);

    mergedStreamRecorder.ondataavailable = event => {
      if (recordinginProgress == true) {
        if ((event.data.size > 0) && (recordingSynched == true) && (streamMergedToYT == true)) {
          //mergedStreamChunks.push(event.data);
          appWebsocket.send(event.data);
        }
      }
    }
    webcamRecorder.onstop = () => {
      // Show that webcam recording has stopped
      msg = "STATUS: Merged Stream Recording stopped."
      document.getElementById("app-status").innerHTML = msg;
    }
    // handle cameraCheckbox changes
    cameraCheckbox.addEventListener('change', async () => {
      // stop the old camera stream
      cameraStream.getTracks().forEach(track => track.stop());

      // get a new camera stream with updated dimensions if checkbox is checked
      if (cameraCheckbox.checked) {
        webcamStreamWidth = Math.floor(0.15 * screenWidth);
        webcamStreamHeight = Math.floor((webcamStreamWidth * screenHeight) / screenWidth);
        cameraStream = await navigator.mediaDevices.getUserMedia({ video: { width: webcamStreamWidth, height: webcamStreamHeight } });
      }

      // add the camera stream to the merger
      merger.addStream(cameraStream, {
        x: 0, // position of the top-left corner
        y: merger.height - webcamStreamHeight, // position of the bottom-left corner
        width: webcamStreamWidth,
        height: webcamStreamHeight,
        mute: true // we don't want sound from the camera
      });

      // re-render the merger
      merger.reRender();
    });

    screenCheckbox.addEventListener('change', async () => {
      try {
        if (screenCheckbox.checked) {
          // get new screen stream and add it to the merger
          const newScreenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
          merger.addStream(newScreenStream, {
            x: 0,
            y: 0,
            width: merger.width,
            height: merger.height,
            mute: true
          });
        } else {
          // stop the old screen stream and re-render the merger
          screenStream.getTracks().forEach(track => {
            track.stop();
          });
          merger.removeStream(screenStream);
        }
        merger.reRender();
      } catch (error) {
        console.error('Error: ', error);
      }
    });

    // handle mute/unmute button click
    const audioBtn = document.getElementById("audio-settings");
    audioBtn.checked = true; // initialize as checked

    audioBtn.addEventListener('click', () => {
      const muteState = !audioBtn.checked; // if checked is false, mute the audio
      merger.addStream(cameraStream, {
        x: 0, // position of the top-left corner
        y: merger.height - webcamStreamHeight, // position of the bottom-left corner
        width: webcamStreamWidth,
        height: webcamStreamHeight,
        mute: muteState // set the mute state of the audio
      });
      audioBtn.innerHTML = muteState ? "Unmute" : "Mute";
    });

  } catch (error) {
    console.error('Error: ', error);
  }
}

/**
 * Function to start recording audio and video streams
 * @async
 * @function startR ecording
 */
async function startRecording() {
  const cameraCheckbox = document.getElementById('webcam-recording');
  const screenCheckbox = document.getElementById('screen-recording');

  // Remove focus from start recording button
  document.getElementById('start').blur();

  // Enable stop recording button

  // Generate random string for appending to file name
  fileRandomString = await generateString(6);

  // Enable or disable audio recording
  try {
    const recordAudio = await microphoneStatus();

    if (recordAudio == true) {
      // Enable audio recording for webcam
      webcamMediaConstraints = {
        video: videoConstraints, audio: true
      };
      console.log(videoConstraints);
      // Enable audio recording for screen recording
      screenAudioConstraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        },
        video: false
      };
    } else {
      // Disable audio recording for webcam
      webcamMediaConstraints = {
        video: videoConstraints, audio: false
      };

      // Disable audio recording for screen recording
      screenAudioConstraints = {
        audio: false,
        video: false
      };
    }
  }
  catch (err) {
    const msg = "STATUS: Screen recording Error.";
    document.getElementById("app-status").innerHTML = msg;
    console.error("Screen recording Error: " + err.message);
  }

  // show the creating broadcast modal
  showCreatingBroadcastModal(true);

  // Record merged screen and webcam stream
  const recordWebcam = cameraCheckbox.checked;
  const recordScreen = screenCheckbox.checked;
  if ((recordScreen == true) && (recordWebcam == true)) {
    try {
      await camAndScreenShare();
      console.log("cam and screen share at a time ")

      // Synchronize recording
      recordingSynched = true;
      streamWebcamToYT = false;
      streamScreenToYT = false;
      streamMergedToYT = true;

      // Create websockets now
      createAllsockets();

      const msg = "STATUS: Recording Started.";
      document.getElementById("app-status").innerHTML = msg;
    }
    catch (err) {
      const msg = "STATUS: Merged stream recording Error.";
      document.getElementById("app-status").innerHTML = msg;
      console.error("Merged stream recording Error: " + err.message);
    }
  } else if (recordWebcam == true) {
    // Record webcam if enabled
    try {
      // Show webcam recording has started
      const msg = "STATUS: Recording Started.";
      document.getElementById("app-status").innerHTML = msg;

      await recordStream();
      recordingSynched = true;
      streamWebcamToYT = true;
      streamScreenToYT = false;
      streamMergedToYT = false;
      streamWebcamToYT = true;

      // Create websockets now
      createAllsockets();
    }
    catch (err) {
      const msg = "STATUS: Webcam recording Error.";
      document.getElementById("app-status").innerHTML = msg;
      console.error("Webcam recording Error: " + err.message);
    }
  } else if (recordScreen == true) {
    // Record screen if enabled
    try {
      // Show screen recording has started
      const msg = "STATUS: Recording Started.";
      document.getElementById("app-status").innerHTML = msg;

      await recordScreenAndAudio();
      recordingSynched = true;
      streamWebcamToYT = false;
      streamScreenToYT = true;
      streamMergedToYT = false;

      // Create websockets now
      createAllsockets();

    }
    catch (err) {
      const msg = "STATUS: Screen recording Error."
      document.getElementById("app-status").innerHTML = msg;
      console.error("Screen recording Error: " + err.message);
    }
  }
}

async function validateAll(){
  let webCam = cameraCheckbox.checked;
  if (webCam == true) {
    webcamMediaConstraints = null
    currentCamera = null
    // let currentCameraIsValid = true
    let cameraErrorMsg = "";
    if (selectVideo.value === 'environment') {
      currentCamera = 'environment';
      videoConstraints.facingMode = currentCamera;

      // currentCameraIsValid = false
    } else if (selectVideo.value === 'user') {
      currentCamera = 'user';
      videoConstraints.facingMode = currentCamera;
    } else {
      currentCamera = 'user';
      videoConstraints.facingMode = currentCamera;
    }
    // if (selectVideo.value === '') {
    //   cameraErrorMsg = "Please select one Camera";
    //   // videoConstraints.facingMode = 'environment';
    //   currentCameraIsValid = false
    // } else {
    //   videoConstraints.deviceId = { exact: selectVideo.value };
    //   currentCameraIsValid = true
    // }
    webcamMediaConstraints = {
      video: videoConstraints, audio: true
    };
    document.getElementById("camera-error").innerHTML = cameraErrorMsg;
    validateModal()
  }else{
    validateModal()
  }
}
// Validates test details
async function validateModal() {

  // Get permission to show notifications in system tray
  showNotificationPermission = await Notification.requestPermission();
  console.log("showNotificationPermission: ", showNotificationPermission);

  // Clear previous test data
  userPlaylistSelection = null;
  currentChannelTitle = null;
  usernameValue = null;
  testNameValue = null;
  testDescriptionValue = null;
  testRecordingData = null;

  // let currentCameraIsValid = true
  // let cameraErrorMsg = "";
  // if (selectVideo.value === '') {
  //   cameraErrorMsg = "Please select one Camera";
  //   // videoConstraints.facingMode = 'environment';
  //   currentCameraIsValid = false
  // } else {
  //   videoConstraints.deviceId = { exact: selectVideo.value };
  //   currentCameraIsValid = true
  // }
  // webcamMediaConstraints = {
  //   video: videoConstraints, audio: true
  // };
  // document.getElementById("camera-error").innerHTML = cameraErrorMsg;
  // validate channel name
  let currentChannelTitleIsValid = true
  currentChannelTitle = document.getElementById("selectChannel").name;
  // Remove leading and trailling white space
  currentChannelTitle = currentChannelTitle.trim();
  let channelTitleErrorMsg = "";

  // // console.log("currentChannelTitle:", currentChannelTitle);

  if (currentChannelTitle === "") {
    channelTitleErrorMsg = "Please select one channel";
    currentChannelTitleIsValid = false;
  }
  document.getElementById("channelname-error").innerHTML = channelTitleErrorMsg;

  // validate playlist name
  let playlistIsValid = true;
  userPlaylistSelection = document.getElementById("selectPlaylist").value;
  userPlaylistSelection = userPlaylistSelection.trim();
  // // console.log("userPlaylistSelection:", userPlaylistSelection);
  let playlistError = "";
  if (userPlaylistSelection === "") {
    playlistError = "Please select a playlist";
    playlistIsValid = false;
  }
  document.getElementById("playlist-error").innerHTML = playlistError;

  // Validate username
  let docIsValid = true;
  usernameValue = document.getElementById("username").name;
  // Remove leading and trailling white space
  usernameValue = usernameValue.trim();
  let msg = "";


  // Check for empty string
  if (usernameValue === "") {
    msg = "Please fill the user name";
    docIsValid = false;
  }

  document.getElementById("username-error").innerHTML = msg;

  // Validate Test Name
  let testNameIsValid = true;
  testNameValue = document.getElementById("test-name").value;
  // Remove leading and trailling white space
  testNameValue = testNameValue.trim();
  let testNameErrorMsg = "";

  // Check for empty string
  if (testNameValue === "") {
    testNameErrorMsg = "Please fill the test name";
    testNameIsValid = false;
  }

  // Check if username starts with a number
  if (testNameValue.match(/^\d/)) {
    testNameErrorMsg = "Test name cannot start with a number";
    testNameIsValid = false;
  }

  // Check for space inside string
  if (/\s/.test(testNameValue)) {
    testNameErrorMsg = "Please replace the space with an underscore for example hi_you";
    testNameIsValid = false;
  }

  document.getElementById("test-name-error").innerHTML = testNameErrorMsg;

  // Get test description
  // testDescriptionValue = document.getElementById("test-description").value;
  // check if camera btn is checked
  // let webCam = cameraCheckbox.checked;
  // if (webCam == true) {
  //   await showCameraModal()
  // }

  // All test details are available now
  if ((docIsValid == true) && (testNameIsValid == true) && (currentChannelTitleIsValid == true) && (playlistIsValid == true)) {
    // Click on close modal button
    // document.getElementById("close-test-details-modal").click();
    // Disable start recording button
    document.getElementById("start").disabled = true;

    setVideoPrivacyStatus()
      .then(() => {
        startRecording();
      })
      .catch((err) => {
        console.error("Start recording error: ", err)
        resetStateOnError();
        showErrorModal();
      });
    /*.catch((error) => {
      console.error("Failed to set video privacy status")
    });*/
  }
}

// Sends recorded test data using axios
async function sendAvailableData(prevProgress) {
  // show record button
  document.querySelector('.record-btn').style.display = 'block';
  // show stop button
  document.querySelector('.stop-btn').style.display = 'none';
  // reset video title
  document.querySelector(".video-title").innerHTML = ""
  // Get csrftoken
  let csrftoken = await getCookie('csrftoken');

  // Send data
  if ((usernameValue != null) && (testRecordingData != null)) {
    setProgressBarValue(50);
    let fileUploadUrl = '/file/upload/';
    let responseStatus = null;
    await fetch(fileUploadUrl, {
      method: 'POST',
      headers: { 'X-CSRFToken': csrftoken },
      body: testRecordingData
    })
      .then(response => {
        // console.log(response)
        responseStatus = response.status;
        // console.log("Response Status", responseStatus);
        // Return json data
        return response.json();
      })
      .then((json) => {
        if (responseStatus == 201) {
          msg = "STATUS: Files Uploaded."
          document.getElementById("app-status").innerHTML = msg;
          setProgressBarValue(100);

          // Clear previous test data
          usernameValue = null;
          testNameValue = null;
          testDescriptionValue = null;
          testRecordingData = null;
          // Clear old webcam data
          webcamChunks = [];
          // Clear old screen recording data
          screenRecorderChunks = [];
          // Clear old merged stream recording data
          mergedStreamChunks = [];
          // Clear task id data
          receivedTaskID = [];
          taskIDwasRreceived = false;
          // clear playlist selection
          userPlaylistSelection = null;
          channelTitle = null;

          // Hide upload in progress modal
          const btnCloseUploadigModal = document.getElementById('btnCloseUploadigModal');
          btnCloseUploadigModal.click();

          // Show upload complete modal
          let uploadCompleteModal = new bootstrap.Modal(document.getElementById('uploadComplete'));
          uploadCompleteModal.show();

          //Set current video file links on vps
          try {
            let newFileLinks = json;
            // // console.log("newFileLinks: ", newFileLinks)
            set_video_links(newFileLinks)
          } catch (error) {
            console.error("Error while setting video links: ", error)
          }
        } else {
          // Server error message
          // // console.log("Server Error Message: ", json)
          msg = "STATUS: Files Upload Failed."
          document.getElementById("app-status").innerHTML = msg;

          // Hide upload in progress modal
          const btnCloseUploadigModal = document.getElementById('btnCloseUploadigModal');
          btnCloseUploadigModal.click();

          // Check which error modal to show
          let errorMessage = null;
          if ("error_msg" in json) {
            errorMessage = json.error_msg;
          }

          if (errorMessage.includes("Failed to get")) {
            // Get task id that has error
            const faultyTaskIDArray = errorMessage.split(";");
            faultyTaskID = faultyTaskIDArray[1];
            faultyTaskID = faultyTaskID.trim();

            // Set the value of the task id input
            clickupTaskIdRetryInput = document.getElementById('clickup-task-id-retry');
            clickupTaskIdRetryInput.value = faultyTaskID;
            // Show clickup task error modal
            taskErrorModal.show();
          } else {
            // Show upload failed modal
            let uploadFailedModal = new bootstrap.Modal(document.getElementById('uploadFailed'));
            uploadFailedModal.show();
          }
        }
      })
      .catch(error => {
        console.error(error);
        msg = "STATUS: Files Upload Failed."
        document.getElementById("app-status").innerHTML = msg;

        // Hide upload in progress modal
        const btnCloseUploadigModal = document.getElementById('btnCloseUploadigModal');
        btnCloseUploadigModal.click();

        // Show upload failed modal
        let uploadFailedModal = new bootstrap.Modal(document.getElementById('uploadFailed'));
        uploadFailedModal.show();
      });
  }
}

// A function to retry sending test data and files to server
async function retryTestFilesUpload() {
  // Hide upload failed modal
  const btnCloseUploadFailedModal = document.getElementById('btnCloseUploadFailedModal');
  btnCloseUploadFailedModal.click();

  msg = "STATUS: Trying to send files again."
  document.getElementById("app-status").innerHTML = msg;

  // Generate random string for appending to file name
  generateString(6).then((randomString) => {
    fileRandomString = randomString;
    // Try to Send test data again
    stopRecording();
  })
}



// A function to check if we need to get the key log file
async function keyLogFileCheck() {
  try {

    //let logKeyboard = keyLogCheckbox.checked;
    let logKeyboard = false;

    if (logKeyboard == true) {
      let msg = "STATUS: Getting key log file."
      document.getElementById("app-status").innerHTML = msg;
      uploadSeleniumIdeFile();
    } else {
      // Proceed to stop test
      stopRecording();
    }
  }
  catch (err) {
    let msg = "STATUS: Checking For Key Log File error."
    document.getElementById("app-status").innerHTML = msg;
    // // console.log("Checking For Key Log File error: " + err.message);
  }
}

// A function to clear global variables on error
async function resetStateOnError() {
  const cameraCheckbox = document.getElementById('webcam-recording');
  const screenCheckbox = document.getElementById('screen-recording');

  console.error("Reseting state due to error");
  let recordWebcam = cameraCheckbox.checked;
  let recordScreen = screenCheckbox.checked;

  // Update application status
  let msg = "STATUS: Recording stopped due to error."
  document.getElementById("app-status").innerHTML = msg;

  // Stop video display tracks
  stopVideoElemTracks(video);
  stopMediaTracks(currentStream);

  // resetonStart()
  // Stop the webcam stream
  if (recordWebcam == true) {
    try {
      webcamRecorder.stream.getTracks().forEach(track => track.stop());
    } catch (err) {
      console.error("Error while stopping webcam recorder: " + err.message);
    }
  }

  // Stop screen stream
  if (recordScreen == true) {
    try {
      screenRecorder.stream.getTracks().forEach(track => track.stop());
    } catch (err) {
      console.error("Error while stopping screen recorder: " + err.message);
    }
  }

  // Stop screen and webcam merged stream
  if ((recordScreen == true) && (recordWebcam == true)) {
    try {
      mergedStreamRecorder.stream.getTracks().forEach(track => track.stop());
    } catch (err) {
      console.error("Error while stopping merged stream recorder: " + err.message);
    }
  }

  // Enable start recording button
  document.getElementById("start").disabled = false;


  // Close any open websocket
  try {
    appWebsocket.close();
  } catch (error) {
    console.error("Error while closing appWebsocket");
  }
  try {
    webcamWebSocket.close();
  } catch (error) {
    console.error("Error while closing webcamWebSocket");
  }
  try {
    screenWebSocket.close();
  } catch (error) {
    console.error("Error while closing screenWebSocket");
  }

  // Reset App global variables
  usernameValue = null;
  testNameValue = null;
  testDescriptionValue = null;
  screenRecorderChunks = [];
  webcamChunks = [];
  mergedStreamChunks = [];
  testRecordingData = null;
  screenRecorder = null;
  mergedStreamRecorder = null;
  webCamStream = null;
  screenStream = null;
  audioStream = null;
  recordinginProgress = false;
  //websocketReconnect = false;
  webcamMediaConstraints = {
    video: videoConstraints, audio: true
  };
  screenAudioConstraints = {
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      sampleRate: 44100
    },
    video: false
  };

  taskIdWebSocket = null;
  receivedTaskID = [];
  taskIDwasRreceived = false;
  // clear playlist selection
  userPlaylistSelection = null;
  channelTitle = null;
  // hide the creating broadcast modal
  showCreatingBroadcastModal(false);
}

// Updates the test information upload progress bar
async function setProgressBarValue(newProgress) {
  let uploadProgressBar = document.getElementById('uploadProgressBar');
  uploadProgressBar.setAttribute("aria-valuenow", newProgress.toString());
  let progressString = newProgress.toString() + "%";
  uploadProgressBar.style.width = progressString;
  uploadProgressBar.innerHTML = progressString;
}



// Generates a random string for attaching to file names
async function generateString(length) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result;
}

// // Shows upload failed modal
// async function showUploadFailedModal() {
//   modalstate = document.getElementById('uploadFailed').classList.contains('show');
//   //// // console.log("modalstate", modalstate);

//   if (modalstate != true) {
//     let uploadFailedModal = document.getElementById('uploadFailed');
//     uploadFailedModal.classList.add('show');
//     // console.log("modal shown");
//   }
// }

async function set_video_links(linksData) {
  // console.log("linksData", linksData)
  let webcamLink = document.getElementById('webcam_link');
  let screenLink = document.getElementById('screen_link');
  let mergedLink = document.getElementById('merged_link');
  let beanoteFileLink = document.getElementById('beanote_file_link');
  let keyLogFileLink = document.getElementById('key_log_file_link');

  // Set links value, check if data exists first
  if ("webcam_file" in linksData) {
    webcamLink.value = linksData.webcam_file;
  }
  if ("screen_file" in linksData) {
    screenLink.value = linksData.screen_file;
  }
  if ("merged_webcam_screen_file" in linksData) {
    mergedLink.value = linksData.merged_webcam_screen_file;
  }
  if ("beanote_file" in linksData) {
    beanoteFileLink.value = linksData.beanote_file;
  }
  if ("key_log_file" in linksData) {
    keyLogFileLink.value = linksData.key_log_file;
  }
}

async function createWebsocket() {
  let wsStart = (window.location.protocol == 'https:')
    ? 'wss://'
    : 'ws://';

  let endpoint = wsStart + window.location.host + "/ws/app/";
  const cameraCheckbox = document.getElementById('webcam-recording');
  const screenCheckbox = document.getElementById('screen-recording');

  appWebsocket = new WebSocket(endpoint);
  // console.log(endpoint)

  appWebsocket.onopen = function (evt) {
    // console.log(evt)

    // Alert user websocket is open
    let msg = "STATUS: Websocket created."
    document.getElementById("app-status").innerHTML = msg;
    // console.log(msg);

    // No need to reconnect
    websocketReconnect = false;

    // Youtube socket was created, create webcam socket if necessary
    let recordWebcam = cameraCheckbox.checked;
    let recordScreen = screenCheckbox.checked;
    if ((recordScreen == true) && (recordWebcam == true)) {
      try {
        createWebcamScreenSocket("webcam")
      } catch (err) {
        console.error("Error while Creating webcam socket: " + err.message);
        resetStateOnError();
        showErrorModal();
      }
    } else {
      // No need to create other sockets
      createBroadcast()
        .catch((err) => {
          console.error("Create broadcast error: ", err)
          resetStateOnError();
          showErrorModal();
        });
    }
  };

  let errorStop = false;
  appWebsocket.onclose = function (evt) {
    // // console.log("Websocket Closed: ", evt)
    if (evt.code != 1000) {
      if (errorStop == false) {
        errorStop = true;
        //alert("Recording stopped due to websocket error!")
      }
    }
  };

  appWebsocket.onerror = function (evt) {
    let msg = "STATUS: Websocket creation error."
    document.getElementById("app-status").innerHTML = msg;
    console.error("Websocket creation error: ", evt.message);

    // Tell user, stop the recording.
    resetStateOnError();
    showErrorModal();
  };

  appWebsocket.onmessage = function (e) {
    //// // console.log('message', e)
    let receivedMsg = e.data;
    //// // console.log("Received data: ", receivedMsg)
    msgRcvdFlag = true;

    if (receivedMsg.includes("RTMP url received: rtmp://")) {
      // // console.log('RTMP url ACK received');

      // Indicate that recording is in progress
      recordinginProgress = true;

      // Start the recorders
      let recordWebcam = cameraCheckbox.checked;
      let recordScreen = screenCheckbox.checked;
      if ((recordScreen == true) && (recordWebcam == true)) {
        screenRecorder.start(200);
        webcamRecorder.start(200);
        mergedStreamRecorder.start(200);
      } else if (recordWebcam == true) {
        webcamRecorder.start(200);
      } else if (recordScreen == true) {
        screenRecorder.start(200);
      }

      // Update application status
      let msg = "STATUS: Recording in Progress."
      document.getElementById("app-status").innerHTML = msg;

      // Start the task id websocket
      /*let getClickupTaskIDs = clickupTaskNotesCheckbox.checked;
      if (getClickupTaskIDs == true) {
        // // console.log("Creating Task ID websocket connection")
        createTaskidWebsocket();
      }*/
    } else {
      //console.error('RTMP url ACK not received');
    }
  };
}

async function createBroadcast() {
  url = "youtube/createbroadcast/api/"
  let broadcast_data = new Object();
  broadcast_data.videoPrivacyStatus = videoPrivacyStatus;
  console.log(videoPrivacyStatus);
  broadcast_data.testNameValue = testNameValue;
  broadcast_data.channel_title = currentChannelTitle;
  // broadcast_data.channel_title = channel_title;
  // // console.log("Broadcast title:", currentChannelTitle);
  json_broadcast_data = JSON.stringify(broadcast_data);
  let csrftoken = await getCookie('csrftoken');
  //headers: {"Content-type":"application/json;charset=UTF-8"}
  const myHeaders = new Headers();
  myHeaders.append('Accept', 'application/json');
  myHeaders.append('Content-type', 'application/json');
  myHeaders.append('X-CSRFToken', csrftoken);

  let broadcastCreated = false;

  await fetch(url, { method: 'post', body: json_broadcast_data, headers: myHeaders })
    .then((response) => {
      if (response.status != 201) {
        if (response.status === 403) {
          return response.json().then(data => {
            console.error(`Error: ${data.message}`);
            let errMsg = data.message;
            resetStateOnError();
            if (errMsg === 'The user is not enabled for live streaming.') {
              errMsg = 'This youtube account is not enabled for live streaming.';
            }
            showErrorModal(errMsg);
          });
        } else {
          throw new Error("Error when creating broadcast!");
        }
      } else {
        broadcastCreated = true;
        return response.json();
      }
    })
    .then((json) => {
      try {
        data = json;
        // console.log("data: ", data);
        newStreamId = data.newStreamId;
        newStreamName = data.newStreamName;
        newStreamIngestionAddress = data.newStreamIngestionAddress;
        //newRtmpUrl=data.newRtmpUrl;
        newRtmpUrl = "rtmp://a.rtmp.youtube.com/live2" + "/" + newStreamName;
        newBroadcastID = data.new_broadcast_id;
      }
      catch {
        // resetStateOnError();
        // showErrorModal();
        return
      }
    })
    .catch((err) => {
      console.error("Broadcast creation error: ", err)
      resetStateOnError();
      showErrorModal();
    });

  if (broadcastCreated == true) {
    // Request user to select a Channel
    // showSelectYoutubePlaylistModal();
    // console.log("broadcast created");
    insertVideoIntoPlaylist()
  }
}

async function endBroadcast() {
  url = "youtube/transitionbroadcast/api/";
  let broadcast_data = new Object();
  broadcast_data.the_broadcast_id = newBroadcastID;
  broadcast_data.channel_title = currentChannelTitle;
  json_broadcast_data = JSON.stringify(broadcast_data);
  let csrftoken = await getCookie('csrftoken');
  //headers: {"Content-type":"application/json;charset=UTF-8"}
  const myHeaders = new Headers();
  myHeaders.append('Accept', 'application/json');
  myHeaders.append('Content-type', 'application/json');
  myHeaders.append('X-CSRFToken', csrftoken);

  fetch(url, { method: 'post', body: json_broadcast_data, headers: myHeaders })
    .then((response) => {
      if (response.status != 200) {
        throw new Error("Error when transitioning broadcast!");
      } else {
        return response.json();
      }
    })
    .then((json) => {
      data = json;
      // console.log("data: ", data);
    })
    .then(console.log("Broadcast Trasitioned to complete state!"))
    .catch((err) => {
      console.error("Broadcast Trasitioning to complete state failed!");
    });
}

async function stopStreamin() {
  try {
    streamWebcamToYT = false;
    streamScreenToYT = false;
    streamMergedToYT = false;
    recordinginProgress = false;
    // Close any open websocket
    try {
      appWebsocket.close(1000, "User stopped recording");;
    } catch (error) {
      console.error("Error while closing appWebsocket");
    }
    try {
      webcamWebSocket.close(1000, "User stopped recording");;
    } catch (error) {
      console.error("Error while closing webcamWebSocket");
    }
    try {
      screenWebSocket.close(1000, "User stopped recording");;
    } catch (error) {
      console.error("Error while closing screenWebSocket");
    }
  } catch (error) {
    console.error("Error while stopping streaming!", error)
  }
}

async function goToPage(event) {
  let youtubeLink = "https://youtu.be/" + newBroadcastID;
  window.open(youtubeLink, '_blank');
  return false;
}

// }
// // share youtube link
// async function shareToFacebook() {
//   let youtubeLink = "https://youtu.be/" + newBroadcastID;
//   // Get name of the youtube video
//   let videoTitle = document.getElementById("test-name").value;
//   let finalvideoTitle = videoTitle.replace(/_/ig, " ");
//   document.querySelector(".facebook").href = `https://www.facebook.com/sharer/sharer.php?u=${youtubeLink}&t=${finalvideoTitle}`;
// }
// async function shareToTwitter() {
//   let youtubeLink = "https://youtu.be/" + newBroadcastID;
//   // Get name of the youtube video
//   let videoTitle = document.getElementById("test-name").value;
//   let finalvideoTitle = videoTitle.replace(/_/ig, " ");
//   document.querySelector(".twitter").href = `https://twitter.com/share?text=${finalvideoTitle}&url=${youtubeLink}&hashtags=${finalvideoTitle}`;
// }
// async function shareToLinkedin() {
//   let youtubeLink = "https://youtu.be/" + newBroadcastID;
//   // Get name of the youtube video
//   let videoTitle = document.getElementById("test-name").value;
//   document.querySelector(".linkedin").href = `https://www.linkedin.com/sharing/share-offsite?url=${youtubeLink}`;
// }
// async function shareToEmail() {
//   //let youtubeLink = "https://youtu.be/9Kann9lg1O8";
//   let youtubeLink = "https://youtu.be/" + newBroadcastID;
//   // Get name of the youtube video
//   let videoTitle = document.getElementById("test-name").value;
//   let finalvideoTitle = videoTitle.replace(/_/ig, " ");
//   document.querySelector(".envelope").href = `mailto=?subject='Watch My Video'&amp;body=${finalvideoTitle}%20${youtubeLink}`;
// }
// async function shareToWhatsapp() {
//   //let youtubeLink = "https://youtu.be/9Kann9lg1O8";
//   let youtubeLink = "https://youtu.be/" + newBroadcastID;
//   // Get name of the youtube video
//   let videoTitle = document.getElementById("test-name").value;
//   let finalvideoTitle = videoTitle.replace(/_/ig, " ");
//   document.querySelector(".whatsapp").href = `https://api.whatsapp.com/send?text=${finalvideoTitle}%20${youtubeLink}`;
// }
// async function copyLink() {
//   let youtubeLink = "https://youtu.be/" + newBroadcastID;

//   // Create a temporary input element to copy link
//   var tempInput = document.createElement("input");
//   tempInput.value = youtubeLink;
//   document.body.appendChild(tempInput);
//   tempInput.select();
//   document.execCommand("copy");
//   document.body.removeChild(tempInput);
//   alert("Link copied to clipboard");
// }


// async function shareLinkModal() {
//   // close modal if open
//   const btnCloseTestDetailsModal = document.getElementById('close-share-link-modal');
//   btnCloseTestDetailsModal.click();
//   // Show modal
//   const testDetailsModal = new bootstrap.Modal(document.getElementById('share-link-modal'));
//   testDetailsModal.show();
// }


// Shows upload failed modal


 async function showErrorModal(liveStreamError = null) {
  if (liveStreamError != null) {
    let errorModal = new bootstrap.Modal(document.getElementById('livestreamErrorModal'));
    // let msg_p = errorModal.querySelector('#livestreamErrorOccurred');
    document.querySelector('#livestreamErrorOccurred').innerHTML = liveStreamError;
    errorModal.show();
  } else {
    let errorModal = new bootstrap.Modal(document.getElementById('errorOccurred'));
    errorModal.show();
  }
}

// Timer to check network status every second
networkTimer = setInterval(() => {
  checkNetworkStatus();
}, 1000) // each 1 second

// Function to check network status
async function checkNetworkStatus() {
  // console.log("Checking network status:");
  let currentDateTime = new Date();
  // console.log("The current date time is as follows:");
  // console.log(currentDateTime);
  let resultInSeconds = currentDateTime.getTime() / 1000;
  // console.log("The current date time in seconds is as follows:")
  // console.log(resultInSeconds);
  let timeNow = resultInSeconds;
  // console.log("Disconnect time count: ", ((timeNow - lastMsgRcvTime)*1000));

  if (msgRcvdFlag == true) {
    lastMsgRcvTime = timeNow;
    msgRcvdFlag = false;
  } else {
    if (recordinginProgress == false) {
      lastMsgRcvTime = timeNow;
    } else if ((timeNow - lastMsgRcvTime) > 25) { // More than 25 secs
      msgRcvdFlag = false;
      lastMsgRcvTime = timeNow;
      // Stop recording due to network problem
      //clearInterval(networkTimer);
      stopStreams();
      resetStateOnError();
      // Show system tray notification and alert
      showNetworkErrorOccurredModal();
    }
  }
}

// sets youtube video privacy status
async function setVideoPrivacyStatus() {
  // Check if we need to make videos public
  let makePublic = publicVideosCheckbox.checked;
  let privateVideo = privateVideosCheckbox.checked;
  if (makePublic == true) {
    videoPrivacyStatus = "public";
  } 
  else if (privateVideo == true) {
    videoPrivacyStatus = "private";
  }
  else {
    videoPrivacyStatus = "unlisted";
  }
}

// Shows the beanote file upload modal
async function showBeanoteFileUploadModal() {
  const cameraCheckbox = document.getElementById('webcam-recording');
  const screenCheckbox = document.getElementById('screen-recording');

  // Synchronized recording stop
  recordingSynched = false;
  let logKeyboard = false;
  let recordWebcam = cameraCheckbox.checked;
  let recordScreen = screenCheckbox.checked;

  // Stop the webcam stream
  if (recordWebcam == true) {
    try {
      webcamRecorder.stream.getTracks().forEach(track => track.stop());
    } catch (err) {
      console.error("Error while stopping webcam recorder: " + err.message);
    }
  }

  // Stop screen stream
  if (recordScreen == true) {
    try {
      screenRecorder.stream.getTracks().forEach(track => track.stop());
    } catch (err) {
      console.error("Error while stopping screen recorder: " + err.message);
    }
  }

  // Stop screen and webcam merged stream
  if ((recordScreen == true) && (recordWebcam == true)) {
    try {
      mergedStreamRecorder.stream.getTracks().forEach(track => track.stop());
    } catch (err) {
      console.error("Error while stopping merged stream recorder: " + err.message);
    }
  }

  // Close modal if showing
  const btnCloseBeanoteFileModal = document.getElementById('closeBeanoteFileModal');
  btnCloseBeanoteFileModal.click();
  // Show the get key log file modal
  let beanoteFileUploadModal = new bootstrap.Modal(document.getElementById('beanoteFileUploadModal'));
  beanoteFileUploadModal.show();
}

// Stop streams
async function stopStreams() {
  const cameraCheckbox = document.getElementById('webcam-recording');
  const screenCheckbox = document.getElementById('screen-recording');
  // Synchronized recording stop
  recordingSynched = false;
  let logKeyboard = false;
  let recordWebcam = cameraCheckbox.checked;
  let recordScreen = screenCheckbox.checked;

  // Stop the webcam stream
  if (recordWebcam == true) {
    try {
      webcamRecorder.stream.getTracks().forEach(track => track.stop());
    } catch (err) {
      console.error("Error while stopping webcam recorder: " + err.message);
    }
  }

  // Stop screen stream
  if (recordScreen == true) {
    try {
      screenRecorder.stream.getTracks().forEach(track => track.stop());
    } catch (err) {
      console.error("Error while stopping screen recorder: " + err.message);
    }
  }

  // Stop screen and webcam merged stream
  if ((recordScreen == true) && (recordWebcam == true)) {
    try {
      mergedStreamRecorder.stream.getTracks().forEach(track => track.stop());
    } catch (err) {
      console.error("Error while stopping merged stream recorder: " + err.message);
    }
  }
}


// Gets the key log file
async function getBeanoteFile() {
  // ===================== Function is Currently Not Impletmented ======================

  const input = document.getElementById('inpt-beanote-file');
  const currentBeanoteFile = input.files[0];

  // Close modal
  if (currentBeanoteFile != null) {
    input.value = "";

    // Initialize the data object if null
    if (testRecordingData == null) {
      testRecordingData = new FormData();
    }

    // Append key log file
    let newFileName = fileRandomString + "_" + currentBeanoteFile.name;
    testRecordingData.set('beanote_file', currentBeanoteFile, newFileName);
    // // console.log("newBeanoteFileName: ", newFileName);

    // Hide the get key log file modal and proceed to stop test
    const btnCloseBeanoteFileModal = document.getElementById('closeBeanoteFileModal');
    btnCloseBeanoteFileModal.click();

    // Check for keylog file
    keyLogFileCheck();
  }
}

async function createWebcamScreenSocket(socketType) {
  let wsStart = (window.location.protocol == 'https:')
    ? 'wss://'
    : 'ws://';
  const cameraCheckbox = document.getElementById('webcam-recording');
  const screenCheckbox = document.getElementById('screen-recording');

  let endpoint = wsStart + window.location.host + "/ws/webcamscreen/";
  let socket = new WebSocket(endpoint);

  if (socketType === "webcam") {
    webcamWebSocket = socket;
  } else {
    screenWebSocket = socket;
  }

  socket.onopen = function (e) {
    // console.log('open', e)
    let msg = "";

    if (socketType === "webcam") {
      webcamFileName = testNameValue + "_" + filesTimestamp + "_" + socketType + ".webm";
      msg = "FILENAME," + webcamFileName;
    } else {
      screenFileName = testNameValue + "_" + filesTimestamp + "_" + socketType + ".webm";
      msg = "FILENAME," + screenFileName;
    }

    socket.send(msg)
  }


  socket.onmessage = function (e) {
    // console.log('message', e)
    let receivedMsg = e.data;
    // console.log("Received data: ", receivedMsg)
    msgRcvdFlag = true;

    if (receivedMsg.includes("Received Recording File Name")) {
      // ToDo: Enable streaming of video using websocket

      // webcam socket was created, create screen socket
      let recordWebcam = cameraCheckbox.checked;
      let recordScreen = screenCheckbox.checked;
      if ((recordScreen == true) && (recordWebcam == true)) {
        try {
          if (socketType === "webcam") {
            createWebcamScreenSocket("screen");
          } else {
            // Start recording
            //startRecording();
            createBroadcast();
          }
        } catch (err) {
          console.error("Error while Creating webcam socket: " + err.message);
          // Tell user, stop the recording.
          resetStateOnError();
          showErrorModal();
        }
      }
    } else {
      //Handle next message;
      console.log(receivedMsg);
      console.log("Received data: ", receivedMsg)
    }
  }

  socket.onerror = function (evt) {
    msg = socketType + "Websocket creation error: ";
    console.error(msg, evt);
    // Tell user, stop the recording.
    resetStateOnError();
    showErrorModal();
  };
}

// Creates all the required websockets
async function createAllsockets() {
  const cameraCheckbox = document.getElementById('webcam-recording');
  const screenCheckbox = document.getElementById('screen-recording');

  let recordWebcam = cameraCheckbox.checked;
  let recordScreen = screenCheckbox.checked;

  try {
    // Create youtube websocket first, then others follow on success
    createRecordingTimestamp()
      .then(createWebsocket())
      .catch((err) => {
        throw new Error(err);
      });
  } catch (err) {
    console.error("Error while Creating sockets: " + err.message);
    // Tell user, stop the recording.
    resetStateOnError();
    showErrorModal();
  }
  //}
}

// Creates a timestamp for the files
async function createRecordingTimestamp() {
  let currentdate = new Date();
  let newTimestamp = currentdate.getDate() + "_"
    + (currentdate.getMonth() + 1) + "_"
    + currentdate.getFullYear() + "_T"
    + currentdate.getHours() + "_"
    + currentdate.getMinutes() + "_"
    + currentdate.getSeconds();

  // Set the files timestamp
  filesTimestamp = newTimestamp;
  // // console.log("New File Timestamp: ", filesTimestamp);
}



// Creates task id websocket
async function createTaskidWebsocket() {
  number_one = document.getElementById('main')
  let wsStart = (window.location.protocol == 'https:')
    ? 'wss://'
    : 'ws://';

  var endpoint = wsStart + window.location.host + "/ws/taskid/"

  var socket = new WebSocket(endpoint)
  taskIdWebSocket = socket;
  // console.log(endpoint)

  socket.onopen = function (e) {
    // console.log('Task ID websocket open', e)
  }


  socket.onmessage = function (e) {
    // console.log('message', e)
    let receivedMsg = e.data;
    // console.log("Received data: ", receivedMsg)
    let task_json_infor = JSON.parse(receivedMsg);

    if ("message" in task_json_infor.payload) {
      let storedUserEmail = localStorage.getItem("userClickupEmail");
      // console.log("storedUserEmail: ", storedUserEmail);
      let receivedUserEmail = task_json_infor.payload.message.history_items[0].user.email;
      // console.log("receivedUserEmail: ", receivedUserEmail);

      // Make sure task id is for current user
      if (storedUserEmail === receivedUserEmail) {
        receivedTaskID.push(task_json_infor.payload.message.task_id);
        taskIDwasRreceived = true;
        // console.log("Received Task ID: ", receivedTaskID);
        alert("Received Task ID: " + receivedTaskID);
      } else {
        // console.log("None user task id received");
      }
    }
  }

  socket.onerror = function (evt) {
    console.error("Websocket creation error: ", evt);
    // Try to reconnect on failure
    taskidWebsocketReconnection();
  };
}

// Makes task id websocket connection retrys
async function taskidWebsocketReconnection() {
  // console.log("Retrying connection to task id websocket in 5 Seconds")
  setTimeout(createTaskidWebsocket(), 5000);
}

// Handle task id checkbox state changes
async function handleTaskIdCheckbox(e) {
  const { checked } = e.target;
  // console.log("Task ID Checked? ", checked)

  if (checked === true) {
    // console.log("Creating Task ID websocket connection")
    //createTaskidWebsocket();
    showUserSettingsModal();
  } else {
    // console.log("Closing Task ID websocket connection")

    receivedTaskID = [];
    taskIDwasRreceived = false;

    try {
      taskIdWebSocket.close();
    } catch (error) {
      console.error("Error while closing webcamWebSocket");
      taskIdWebSocket = null;
    }
  }
}


// show user settings modal
async function showUserSettingsModal() {

  // Check if user email is stored
  let storedUserEmail = localStorage.getItem("userClickupEmail");

  if (storedUserEmail === null) {
    // close modal if open
    const btnCloseUserSettingsModal = document.getElementById('close-user-settings-modal');
    btnCloseUserSettingsModal.click();

    // Show modal
    userSettingsModal.show();
  }
}

// Shows get task id from user modal
async function showGetTaskIdFromUserModal() {
  const cameraCheckbox = document.getElementById('webcam-recording');
  const screenCheckbox = document.getElementById('screen-recording');
  // Stop video display tracks
  await stopVideoElemTracks(video);

  try {
    // Try to stop network timer
    try {
      clearInterval(networkTimer);
    } catch (error) {
      console.error("Error while stopping network timer!");
    }

    // Synchronized recording stop
    recordingSynched = false;
    //let logKeyboard = keyLogCheckbox.checked;
    let recordWebcam = cameraCheckbox.checked;
    let recordScreen = screenCheckbox.checked;

    // Stop the webcam stream
    if (recordWebcam == true) {
      try {
        webcamRecorder.stream.getTracks().forEach(track => track.stop());
      } catch (err) {
        console.error("Error while stopping webcam recorder: " + err.message);
      }
    }

    // Stop screen stream
    if (recordScreen == true) {
      try {
        screenRecorder.stream.getTracks().forEach(track => track.stop());
      } catch (err) {
        console.error("Error while stopping screen recorder: " + err.message);
      }
    }

    // Stop screen and webcam merged stream
    if ((recordScreen == true) && (recordWebcam == true)) {
      try {
        mergedStreamRecorder.stream.getTracks().forEach(track => track.stop());
      } catch (err) {
        console.error("Error while stopping merged stream recorder: " + err.message);
      }
    }

    // Check if we need to show modal first
    //let getClickupTaskNotes = clickupTaskNotesCheckbox.checked;
    let getClickupTaskNotes = false;
    if ((getClickupTaskNotes == true) && (receivedTaskID.length <= 0)) {
      // Get task id from user
      let msg = "STATUS: Getting Task ID from user..."
      document.getElementById("app-status").innerHTML = msg;

      // close modal if open
      const btnCloseGetTaskIdFromUserModal = document.getElementById('btnCloseGetTaskIdFromUserModal');
      btnCloseGetTaskIdFromUserModal.click();

      // Show modal
    } else {
      // Proceed to check for beanote and selenium ide fiels
      keyLogFileCheck();
    }
  } catch (err) {
    let msg = "STATUS: Error While Getting Clickup Task ID From User."
    document.getElementById("app-status").innerHTML = msg;
  }
}

// Saves task id from user
async function saveTaskIDFromUser() {
  // Validate clickup task ID
  let taskIDIsValid = true;
  let newClickupTaskIDs = document.getElementById("clickupTaskIdFromUser").value;
  //// console.log("newClickupTaskIDs: ",newClickupTaskIDs);
  // Remove leading and trailling white space
  newClickupTaskIDs = newClickupTaskIDs.trim();
  // Remove forward slashes
  newClickupTaskIDs = newClickupTaskIDs.replaceAll('/', '');
  // Remove hash symbol
  newClickupTaskIDs = newClickupTaskIDs.replaceAll('#', '');
  // console.log("newClickupTaskIDs: ", newClickupTaskIDs);
  let idMsg = "";

  // Check for empty string
  if (newClickupTaskIDs === "") {
    idMsg = "Please fill the task id";
    taskIDIsValid = false;
  }

  document.getElementById("clickupTaskIdFromUserError").innerHTML = idMsg;

  // Proceed to check for keylog file
  if (taskIDIsValid) {
    // Add the new task id to global list of task ids
    const newTaskIDsArray = newClickupTaskIDs.split(",");
    // console.log("newTaskIDsArray: ", newTaskIDsArray)
    for (taskID in newTaskIDsArray) {
      let tempTaskID = newTaskIDsArray[taskID].trim();
      // console.log("tempTaskID: ", tempTaskID);

      if (tempTaskID !== null) {
        receivedTaskID.push(tempTaskID);
      }
    }
    // Hide get task id from user modal
    const btnCloseGetTaskIdFromUserModal = document.getElementById('btnCloseGetTaskIdFromUserModal');
    btnCloseGetTaskIdFromUserModal.click();

    keyLogFileCheck();
  }
}

// Stops video element tracks
async function stopVideoElemTracks(videoElem) {
  // Actual video display element
  try {
    let tracks = videoElem.srcObject.getTracks();
    tracks.forEach(track => track.stop());
    videoElem.srcObject = null;
  } catch (error) {
    console.error("Error while stopping video display tracks: ", error.message)
  }

  // audio stream
  try {
    audioStream.getTracks().forEach(track => track.stop());
  } catch (error) {

  }

  // screen stream
  try {
    screenStream.getTracks().forEach(track => track.stop());
  } catch (error) {

  }

  // webcam stream
  try {
    webCamStream.getTracks().forEach(track => track.stop());
  } catch (error) {

  }
}

// for debugging formdata object
async function debugFormData(formdataObject) {
  for (var pair of formdataObject.entries()) {
    // console.log(pair[0] + ', ' + pair[1]);
  }
}
// Removes clickup ids from upload data
async function removeClickupTaskIds() {
  //await debugFormData(testRecordingData);
  try {
    // Remove task ids array
    testRecordingData.delete('clickupTaskIDs');

    // Clear task ids array
    receivedTaskID = [];
    //await debugFormData(testRecordingData);
  } catch (error) {
    console.error("Error while removing clickup task ids from upload data.", error);
  }
}

// Upload data without clickup notes
async function uploadWithoutClickupNotes() {
  removeClickupTaskIds().then(() => {
    retryTestFilesUpload();
  }).catch(() => {
    console.error("Error while uploading without clickup task notes.");
  });
}

// Inserts a video into a youtube playlist
async function insertVideoIntoPlaylist() {
  // hide the creating broadcast modal
  let playlistItemsInsertURL = '/youtube/playlistitemsinsert/api/';
  let csrftoken = await getCookie('csrftoken');
  let responseStatus = null;
  await fetch(playlistItemsInsertURL, {
    method: 'POST',
    body: JSON.stringify({
      videoId: newBroadcastID,
      // playlistId: currentRadioButtonID,
      playlistId: userPlaylistSelection,
      channel_title: currentChannelTitle
    }),
    headers: {
      "Content-type": "application/json; charset=UTF-8",
      'X-CSRFToken': csrftoken
    }
  })
    .then(response => {
      // console.log(response)
      responseStatus = response.status;
      // console.log("Insert video into user playlist Response Status", responseStatus);
      // Return json data
      return response.json();
    })
    .then((json) => {
      if (responseStatus == 200) {
        msg = "STATUS: Video Inserted Into User Playlist."
        document.getElementById("app-status").innerHTML = msg;

        // Insert video into daily playlist
        if (todaysPlaylistId != null) {
          insertVideoIntoTodaysPlaylist();
        } else {
          sendRTMPURL();
        }

      } else {
        // Server error message
        // console.log("Server Error Message: ", json)
        msg = "STATUS: Failed to Insert Video Into User Playlist."
        document.getElementById("app-status").innerHTML = msg;

        // Show error modal
        playlistInsertVideoErrorModal();
      }
    })
    .catch(error => {
      console.error(error);
      msg = "STATUS: Failed to Insert Video Into User Playlist."
      document.getElementById("app-status").innerHTML = msg;

      // Show error modal
      playlistInsertVideoErrorModal();
    });
  // display some buttons and remove some
  displayUtilities()
}

// Inserts a video into the current day's youtube playlist
async function insertVideoIntoTodaysPlaylist() {
  showCreatingBroadcastModal(false);
  let playlistItemsInsertURL = '/youtube/playlistitemsinsert/api/';
  let csrftoken = await getCookie('csrftoken');
  let responseStatus = null;
  await fetch(playlistItemsInsertURL, {
    method: 'POST',
    body: JSON.stringify({
      videoId: newBroadcastID,
      playlistId: todaysPlaylistId,
      channel_title: currentChannelTitle
    }),
    headers: {
      "Content-type": "application/json; charset=UTF-8",
      "X-CSRFToken": csrftoken
    }
  })
    .then(response => {
      // console.log(response)
      responseStatus = response.status;
      // console.log("Insert video into daily playlist Response Status", responseStatus);
      // Return json data
      return response.json();
    })
    .then((json) => {
      if (responseStatus == 200) {
        msg = "STATUS: Video Inserted Into Daily Playlist."
        document.getElementById("app-status").innerHTML = msg;

        // Proceed to send RTMP URL
        sendRTMPURL();

      } else {
        // Server error message
        // console.log("Server Error Message: ", json)
        msg = "STATUS: Failed to Insert Video Into Daily Playlist."
        document.getElementById("app-status").innerHTML = msg;

        // Show error modal
        playlistInsertVideoErrorModal();
      }
    })
    .catch(error => {
      console.error(error);
      msg = "STATUS: Failed to Insert Video Into Daily Playlist."
      document.getElementById("app-status").innerHTML = msg;

      // Show error modal
      playlistInsertVideoErrorModal();
    });
}

// Sends an RTMP URL to the websocket
function sendRTMPURL() {
  displayTimer()
  showCreatingBroadcastModal(false);
  // Check if we need to add audio stream
  let recordAudio = microphoneStatus();
  if (recordAudio == true) {
    let msg = "browser_sound," + newRtmpUrl;
    appWebsocket.send(msg)
    // console.log("Sent RTMP URL: ", msg)
  } else {
    appWebsocket.send(newRtmpUrl)
    // console.log("Sent RTMP URL: ", newRtmpUrl)
  }
  // display some buttons and remove some
  displayUtilities()
}

// Shows youtube playlist insert video error modal
async function playlistInsertVideoErrorModal() {

  // close modal if open
  const btnClosePlaylistInsertErrorModal = document.getElementById('btnClosePlaylistInsertErrorModal');
  btnClosePlaylistInsertErrorModal.click();

  // Show modal
  const playlistInsertErrorModal = new bootstrap.Modal(document.getElementById('playlist-insert-video-error-modal'));
  playlistInsertErrorModal.show();
}

// Creating youtube broadcast modal
async function showCreatingBroadcastModal(showModal) {
  if (showModal) {
    // close modal if open
    const btnCloseCreatingBroadcastModal = document.getElementById('btnCloseCreatingBroadcastModal');
    btnCloseCreatingBroadcastModal.click();

    // Show modal
    const creatingBroadcastModal = new bootstrap.Modal(document.getElementById('creatingBroadcastModal'));
    creatingBroadcastModal.show();
  } else {
    // close modal
    const btnCloseCreatingBroadcastModal = document.getElementById('btnCloseCreatingBroadcastModal');
    btnCloseCreatingBroadcastModal.click();
  }
}

// close youtube list selection modal
async function closeYoutubePlaylistSelectionModal() {
  resetStateOnClosingPlaylistModal()
}

// reset state on closing youtube playlist modal
async function resetStateOnClosingPlaylistModal() {
  const cameraCheckbox = document.getElementById('webcam-recording');
  const screenCheckbox = document.getElementById('screen-recording');


  // console.error("Reseting state due to error");
  let recordWebcam = cameraCheckbox.checked;
  let recordScreen = screenCheckbox.checked;

  // Update application status
  let msg = "STATUS: Youtube Playlist Selection Modal Closed."
  document.getElementById("app-status").innerHTML = msg;

  // Stop video display tracks
  stopVideoElemTracks(video);




  // show record button
  document.querySelector('.record-btn').style.display = 'block';

  // Stop the webcam stream
  if (recordWebcam == true) {
    try {
      webcamRecorder.stream.getTracks().forEach(track => track.stop());
    } catch (err) {
      console.error("Error while stopping webcam recorder: " + err.message);
    }
  }

  // Stop screen stream
  if (recordScreen == true) {
    try {
      screenRecorder.stream.getTracks().forEach(track => track.stop());
    } catch (err) {
      console.error("Error while stopping screen recorder: " + err.message);
    }
  }

  // Stop screen and webcam merged stream
  if ((recordScreen == true) && (recordWebcam == true)) {
    try {
      mergedStreamRecorder.stream.getTracks().forEach(track => track.stop());
    } catch (err) {
      console.error("Error while stopping merged stream recorder: " + err.message);
    }
  }

  // Enable start recording button
  document.getElementById("start").disabled = false;


  // Close any open websocket
  try {
    appWebsocket.close();
  } catch (error) {
    console.error("Error while closing appWebsocket");
  }
  try {
    webcamWebSocket.close();
  } catch (error) {
    console.error("Error while closing webcamWebSocket");
  }
  try {
    screenWebSocket.close();
  } catch (error) {
    console.error("Error while closing screenWebSocket");
  }

  // Reset App global variables
  usernameValue = null;
  testNameValue = null;
  testDescriptionValue = null;
  screenRecorderChunks = [];
  webcamChunks = [];
  mergedStreamChunks = [];
  testRecordingData = null;
  screenRecorder = null;
  mergedStreamRecorder = null;
  webCamStream = null;
  screenStream = null;
  audioStream = null;
  recordinginProgress = false;
  //websocketReconnect = false;
  webcamMediaConstraints = {
    video: videoConstraints, audio: true
  };
  screenAudioConstraints = {
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      sampleRate: 44100
    },
    video: false
  };

  taskIdWebSocket = null;
  receivedTaskID = [];
  taskIDwasRreceived = false;
  // clear playlist selection
  userPlaylistSelection = null;
  channelTitle = null;
  // hide the creating broadcast modal
  showCreatingBroadcastModal(false);
}


// Creating new playlist modal
// const showCreatingNewPlaylistModal = async () => {
//   // close modal if open
//   const btnCloseNewPlaylistDetailsModal = document.getElementById('close-new-playlist-details-modal');
//   btnCloseNewPlaylistDetailsModal.click();

//   // Show modal
//   const creatingNewPlaylistModal = new bootstrap.Modal(document.getElementById('new-playlist-details-modal'));
//   creatingNewPlaylistModal.show();

// }

// On press handler for the create playlist button
async function handleCreatePlaylistRequest() {

  // disable button first 
  const btnCreatePlaylist = document.getElementById("create-playlist")
  btnCreatePlaylist.disabled = true;

  // Validate new playlist title
  let docIsValid = true;
  let newPlaylistTitle = document.getElementById("playlist_title_modal").value;
  // Remove leading and trailling white space
  newPlaylistTitle = newPlaylistTitle.trim();
  let msg = "";

  // Check for empty string
  if (newPlaylistTitle === "") {
    msg = "Please fill in the playlist title";
    docIsValid = false;
  }


  document.getElementById("p_title-error").innerHTML = msg;

  // Get playlist description
  // let newPlaylistDescription = document.getElementById("playlist_description_modal").value;

  // Get playlist privacy status
  // let newPlaylistPrivacyStatus = document.getElementById("playlist_privacy_status_modal").value;
  let newPlaylistPrivacyStatus = document.querySelector('input[name="privacy_status"]:checked').value;

  if (docIsValid) {
    // close create new playlist modal
    const btnCloseNewPlaylistDetailsModal = document.getElementById('close-new-playlist-details-modal');
    btnCloseNewPlaylistDetailsModal.click();

    // Show creating playlist spinner
    showCreatingPlaylistModal(true);

    // Make request to create playlist
    // await createNewPlaylist(newPlaylistTitle, newPlaylistDescription, newPlaylistPrivacyStatus);
    await createNewPlaylist();
  }

  // Enable create playlist button
  btnCreatePlaylist.disabled = false;

}


// Makes api request to create playlist
async function createNewPlaylist() {
  // async function createNewPlaylist(title, description, privacyStatus) {
  let createPlaylistURL = '/youtube/createplaylist/api/';
  let responseStatus = null;
  // const form = document.getElementById("create-playlist");
  const form = document.getElementById("create-playlist");
  const csrf_token = document.getElementsByName('csrfmiddlewaretoken')[0].value;
  // const csrf_token = form.querySelector('input[name="csrfmiddlewaretoken"]').value;
  const channel = document.getElementById("selectChannel_1").value;
  // const description = document.getElementById("playlist_description_modal").value;
  const title = document.getElementById("playlist_title_modal").value;
  let privacy = document.querySelector('input[name="privacy_status"]:checked').value;
  // const privacy = document.getElementById("playlist_privacy_status_modal").value;
  // const data = new FormData(form);
  await fetch(createPlaylistURL, {
    method: 'POST',
    body: JSON.stringify({
      new_playlist_title: title,
      new_playlist_description: "",
      new_playlist_privacy: privacy,
      channel_title: channel
    }),
    headers: {
      "Content-type": "application/json; charset=UTF-8",
      "X-CSRFToken": csrf_token
    }
  })
    .then(response => {
      // console.log(response)
      responseStatus = response.status;
      // console.log("Create playlist Response Status", responseStatus);
      // Return json data
      return response.json();
    })
    .then((json) => {
      if (responseStatus == 200) {
        msg = "STATUS: Playlist Created"
        document.getElementById("app-status").innerHTML = msg;

        // Hide creating playlist spinner
        showCreatingPlaylistModal(false);

        // Show playlist created modal
        showPlaylistCreatedModal();

        // clear modal input fields
        document.getElementById("selectChannel_1").value = "";
        document.getElementById("playlist_title_modal").value = "";
        document.querySelector('input[name="privacy_status"]:checked').value = "";
        // document.getElementById("playlist_description_modal").value = "";
      } else if (responseStatus == 409) {
        // Server error message
        // console.log("Server Error Message: ", json)
        msg = "STATUS: Playlist Already Exists."
        document.getElementById("app-status").innerHTML = msg;

        // Hide creating playlist spinner
        showCreatingPlaylistModal(false);

        // Show error modal
        showPlaylistAlreadyExistsModal();
      } else {
        // Server error message
        // console.log("Server Error Message: ", json)
        msg = "STATUS: Failed to create playlist."
        document.getElementById("app-status").innerHTML = msg;

        // Hide creating playlist spinner
        showCreatingPlaylistModal(false);
        // Show error modal
        showPlaylistCreationErrorModal();
      }
    })
    .catch(error => {
      console.error(error);
      msg = "STATUS: Failed to create playlist."
      document.getElementById("app-status").innerHTML = msg;

      // Hide creating playlist spinner
      showCreatingPlaylistModal(false);
      // Show error modal
      showPlaylistCreationErrorModal();
    });
}

// Shows Playlist was created modal
async function showPlaylistCreatedModal() {
  // close modal if open
  const btnClosePlaylistCreatedModal = document.getElementById('close-playlist-created-modal');
  btnClosePlaylistCreatedModal.click();

  // Show modal
  const playlistCreatedModal = new bootstrap.Modal(document.getElementById('playlist-created-modal'));
  playlistCreatedModal.show();
}

// Shows Playlist creation Error occurred modal
async function showPlaylistCreationErrorModal() {
  // close modal if open
  const btnClosePlaylistCreationErrorModal = document.getElementById('close-playlist-creation-error-modal');
  btnClosePlaylistCreationErrorModal.click();

  // Show modal
  const playlistCreationErrorModal = new bootstrap.Modal(document.getElementById('playlist-creation-error-modal'));
  playlistCreationErrorModal.show();
}


async function getSupportedMediaType() {
  let options = null;

  // Rolling back the mime type feature
  options = {
    mimeType: 'video/webm; codecs=h264',
    //videoBitsPerSecond: 3000000
    videoBitsPerSecond: 1200000
  };
  return options;
}

// Shows the playlists already exists modal
async function showPlaylistAlreadyExistsModal() {
  // close modal if open
  const btnClosePlaylistAlreadyExistsModal = document.getElementById('close-playlist-already-exists-modal');
  btnClosePlaylistAlreadyExistsModal.click();

  // Show modal
  const playlistAlreadyExistsModal = new bootstrap.Modal(document.getElementById('playlist-already-exists-modal'));
  playlistAlreadyExistsModal.show();
}


// show network error system tray notification
async function showNetworkErrorSystemTrayNotification() {
  // check for permission first
  if (showNotificationPermission === 'granted') {
    const errorNotification = new Notification('Recording stopped due to network error!', {
      body: '1. Check your internet connection.\n2. Start the recording process again.',
      icon: '/static/images/favicon.jpg'
    });
  }
}

// Shows the network error occurred modal
async function showNetworkErrorOccurredModal() {

  // Show network error system tray notification
  showNetworkErrorSystemTrayNotification();

  // Show an alert instead of a modal, with small delay
  setTimeout(showNetworkErrorAlert, 50);

}

// Shows a network error alert
function showNetworkErrorAlert() {
  let msg1 = "Recording stopped due to network error, please do the following.\n";
  let msg2 = " 1. Check your internet connection.\n";
  let msg3 = " 2. Refresh the page on your browser.\n";
  let msg4 = " 3. Start the recording process again.";
  let msg = msg1 + msg2 + msg3 + msg4;

  alert(msg);
}

// Shows creating playlist modal
async function showCreatingPlaylistModal(status) {

  if (status === true) {
    // close modal if open
    const btnCloseCreatingPlaylistModal = document.getElementById('btnCloseCreatingPlaylistModal');
    btnCloseCreatingPlaylistModal.click();

    // Show modal
    const creatingPlaylistModal = new bootstrap.Modal(document.getElementById('creatingPlaylistModal'));
    creatingPlaylistModal.show();
  } else {
    // close modal if open
    const btnCloseCreatingPlaylistModal = document.getElementById('btnCloseCreatingPlaylistModal');
    btnCloseCreatingPlaylistModal.click();
  }
}

// =====================================  Adding A Channel ================================================
async function showAddChannelModal() {
  // close modal if open
  const btnCloseAddNewChannelModal = document.getElementById('close-add-channel-modal');
  btnCloseAddNewChannelModal.click();

  // Show the Add Channel Modal
  const createChannelModal = new bootstrap.Modal(document.getElementById('add-channel-modal'));
  createChannelModal.show();
}
let channel_id = document.querySelector('input[name=channel_id');
channel_id.addEventListener('keyup', () => {
  document.getElementById('id-error').innerText = '';
})
// Confiqure error display 
let channel_title = document.querySelector('input[name=channel_title]');
channel_title.addEventListener('keyup', () => {
  document.getElementById('title-error').innerText = '';
}
);

document.getElementById("add-channel-btn").addEventListener("click", async function (event) {
  event.preventDefault();

  const idMsg = 'Invalid channel ID format'
  const titleMsg = "Title should not include a dot(.) and be at least 3 and at most 50 characters";
  // const credentialMsg = 'Invalid credential format';
  let channelId = document.getElementById("channel_id_modal").value;
  let channelTitle = document.getElementById("channel_title_modal").value;
  // let channelCredentials = document.getElementById("channel_credentials_modal").value;
  const idError = document.getElementById('id-error');
  const titleError = document.getElementById('title-error');
  // const credentialError = document.getElementById('credential-error');  
  let valid_input = true;

  if (!channelId.match(/^UC[a-zA-Z0-9-_]{22}$/)) {
    idError.innerText = idMsg;
    valid_input = false;
  }
  if (!channelTitle.match(/^[a-zA-Z0-9_ -]{3,50}$/)) {
    titleError.innerText = titleMsg;
    valid_input = false;
  }

  if (valid_input) {
    const form = document.getElementById("add-channel");
    const formData = new FormData(form);
    fetch("http://127.0.0.1:8000/", {
      method: 'POST',
      body: formData
    })
      .then(async response => {
        const resp = await response.json()
        const { channel_id, channel_title, channel_credential } = resp;
        if (channel_id) {
          idError.innerText = channel_id[0]
        }
        if (channel_title) {
          titleError.innerText = channel_title[0]
        }
        if (channel_credential) {
          credentialError.innerText = channel_credential[0]
        }
        if ('message' in resp) {
          if (resp['message'] === 'Invalid channel!') {
            document.getElementById('add-status').style.color = 'rgb(161, 76, 76)';
            document.getElementById('add-status').innerText = resp['message'];
          } else {
            document.getElementById('add-status').style.color = 'rgb(72, 174, 128)';
            document.getElementById('add-status').innerText = resp['message'];
          }
        }
      })
  }
})



document.getElementById("create-playlist-btn").addEventListener("click", async function (event) {
  event.preventDefault();
  handleCreatePlaylistRequest();
})

// display some buttons and remove some
function displayUtilities() {
  // show stop button
  document.querySelector('.stop-btn').style.display = 'block';


  // show stop button
  document.querySelector('.record-btn').style.display = 'none';
  // disable playlist button
  document.querySelector('#create-playlist').disabled = true;
  // disable channel button
  // document.querySelector('#view_records').disabled = true;
  document.querySelector('#selectChannel').disabled = true;
  document.querySelector('.selectPlaylist').disabled = true;
  document.querySelector('#test-name').disabled = true;
  document.querySelector('.logout-disable').removeAttribute("href");
  // document.querySelector('#webcam-recording').disabled = true;
  // document.querySelector('#screen-recording').disabled = true;
  document.querySelector('#audio-settings').disabled = true;
  document.querySelector('#public-videos').disabled = true;
  document.querySelector('#private-videos').disabled = true;

  // clear navbar forms
  // document.getElementById("selectChannel").value = "";
  // document.getElementById("test-name").value = "";
  // Enable share records button
  if (publicVideosCheckbox.checked || privateVideosCheckbox.checked == false ) {
    btnShareRecords.style.display = "block";
  } else {
    btnShareRecords.style.display = "none";
  }

  // Get name of the youtube video
  let finalvideoTitle = testNameValue.replace(/_/ig, " ");
  document.querySelector(".video-title").innerHTML = `<h2>${finalvideoTitle}</h2>`
}

// /* fetch channels for user */
// async function fetchUserChannel() {
//   let channelsApiUrl = 'youtube/channels/';

//   let status = null
//   await fetch(channelsApiUrl, {
//     method: 'GET',
//   })
//     .then(response => {
//       status = response.status;
//       return response.json();
//     })
//     .then((data) => {
//       if (status == 200) {
//         msg = "STATUS: User Channel Received."
//         document.getElementById("app-status").innerHTML = msg;
//         let userChannels = data;
//         // console.log("channel_list:", userChannels);
//         userChannels.map((obj) => {
//           let opt = document.createElement("option");
//           let opt_1 = document.createElement("option");
//           let channel_id = obj.channel_id;
//           // console.log(channel_id);
//           let channel_title = obj.channel_title;
//           // console.log(channel_title);
//           // opt.value = channel_id;
//           opt.value = channel_title;
//           opt_1.value = channel_title;
//           opt.innerHTML = channel_title;
//           opt_1.innerHTML = channel_title;
//           channelSelect.append(opt);
//           channelSelect_1.append(opt_1);
//           channelSelect.value = channel_title;
//           channelSelect.name = channel_title;
//           // console.log(opt);
//         })
//       } else {
//         // Server error message
//         // console.log("Server Error Message: ", data)
//         msg = "STATUS: Failed to Fetch Channel."
//         document.getElementById("app-status").innerHTML = msg;
//       }
//     }).catch(error => {
//       console.error(error);
//       msg = "STATUS: Failed to Fetch Channel."
//       document.getElementById("app-status").innerHTML = msg;
//     });
// }
fetchUserChannel();

// async function loadUserPlaylist() {
//   let channel = document.getElementById("selectChannel").name;
//   fetchUserPlaylists(channel);
// }
loadUserPlaylist(todaysPlaylistId);


// let selectUserPlaylist = document.querySelector(".selectPlaylist")
// async function fetchUserPlaylists(channel_title) {
//   let csrftoken = await getCookie('csrftoken');
//   const myHeaders = new Headers();
//   myHeaders.append('Accept', 'application/json');
//   myHeaders.append('Content-type', 'application/json');
//   myHeaders.append('X-CSRFToken', csrftoken);
//   let fetchPlaylistsApiUrl = '/youtube/fetchplaylists/api/';
//   let responseStatus = null;
//   let msg = '';

//   await fetch(fetchPlaylistsApiUrl, {
//     method: 'POST',
//     headers: myHeaders,
//   })
//     .then(response => {
//       responseStatus = response.status;
//       // console.log(responseStatus);
//       return response.json();
//     })
//     .then((json) => {
//       if (responseStatus == 200) {
//         msg = "STATUS: Playlists Received."
//         document.getElementById("app-status").innerHTML = msg;
//         let userPlaylists = json.id_title_dict;
//         // console.log("userPlaylists:", userPlaylists);
//         for (const key in userPlaylists) {
//           // console.log(`${key}: ${userPlaylists[key]}`);
//           let opt = document.createElement("option");
//           opt.innerHTML = userPlaylists[key];
//           opt.value = key;
//           selectUserPlaylist.append(opt)
//           // selectUserPlaylist.innerHTML = opt
//         }
//         // Get today's playlist id
//         let todaysPlaylistObject = json.todays_playlist_dict
//         // console.log("todaysPlaylistObject: ", todaysPlaylistObject);
//         todaysPlaylistId = todaysPlaylistObject.todays_playlist_id
//         // console.log("todaysPlaylistId: ", todaysPlaylistId);
//       } else {
//         // Server error message
//         // console.log("Server Error Message: ", json)
//         msg = "STATUS: Failed to Fetch Playlists."
//         document.getElementById("app-status").innerHTML = msg;
//       }

//     }).catch(error => {
//       console.error(error);
//       msg = "STATUS: Failed to Fetch Playlists."
//       document.getElementById("app-status").innerHTML = msg;
//     });
// }

function resetonStartRecording() {

  // show record button
  document.querySelector('.record-btn').style.display = 'block';

  // reset video title 
  document.querySelector(".video-title").innerHTML = "";
  document.querySelector('#selectChannel').disabled = true;
  document.querySelector('.selectPlaylist').disabled = false;
  document.querySelector('#test-name').disabled = false;
  document.querySelector('#create-playlist').disabled = false;
  document.querySelector('.logout-disable').setAttribute("href", "youtube/logout/");
  document.querySelector('#audio-settings').disabled = false;
  document.querySelector('#public-videos').disabled = false;
  document.querySelector('#private-videos').disabled = false;

}




