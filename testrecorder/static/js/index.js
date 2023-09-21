const controller = new AbortController();
const signal = controller.signal;

// Some app controls
let video = document.getElementById('video')
let cameraCheckbox = document.getElementById('webcam-recording')
let screenCheckbox = document.getElementById('screen-recording')
let audioCheckbox = document.getElementById('audio-settings')
let switchCamera = document.querySelector(".switch-btn")
let publicVideosCheckbox = document.getElementById('public-videos')
let privateVideosCheckbox = document.getElementById('private-videos')
let unlistedVideosCheckbox = document.getElementById('unlisted-videos')
let selectCamerabutton = document.getElementById('choose-camera');
let selectVideo = document.getElementById('video-source');
let selectAudio = document.getElementById('audio-source');
let currentStream;

let btnShareRecords = document.querySelector('.share-record-btn');
let channelSelect = document.getElementById("selectChannel");
let channelSelect_1 = document.getElementById("selectChannel_1");

// App global variables
let usernameValue = null;
let testNameValue = null;
let testDescriptionValue = null;

let recordingStoped = false;

let screenRecorderChunks = [];
let webcamChunks = [];
let mergedStreamChunks = [];
let testRecordingData = null;
let screenRecorder = null;
let mergedStreamRecorder = null;
let webcamRecorder = null
// ======================================================================
streamRecorder = null;
// ======================================================================
let webcamStream = null;
let screenStream = null;
let audioStream = null;

let currentCamera = "user";
let audioConstraints = {
  deviceId: { exact: "default" }
};
let videoConstraints = {
  facingMode: currentCamera
};
let screenAudioConstraints = {
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    sampleRate: 44100
  },
  video: false
};
let = webcamMediaConstraints = null;
let recordingSynched = false;

let fileRandomString = "qwerty";
let socket = null;
let webcamScreenWebSocket = null;
let appWebsocket = null;
let webcamWebSocket = null;
let screenWebSocket = null;
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
let currentChannelTitle = null;
let showNotificationPermission = 'default';

// let player = null;

// video timer
let videoTimer = document.querySelector(".video-timer")
// let switchCamBtn = document.querySelector(".switch-btn")
let hourTime = document.querySelector(".hour-time")
let minuteTime = document.querySelector(".minute-time")
let secondTime = document.querySelector(".second-time")
let timeInterval;
let totalTime = 0;
// navigator.mediaDevices.getUserMedia({ audio: true, video: true })
//   .then(function (stream) {
//     console.log('Got stream, time diff :', Date.now() - now);
//   })
//   .catch(function (err) {
//     console.log('GUM failed with error, time diff: ', Date.now() - now);
//   });

$(document).ready(() => {
  if ((window.location.pathname === '/') && isAuthenticated) {
    // display user
    let userIcon = document.querySelector(".user-icon");
    let userDisplay = document.querySelector(".user-display");
    userIcon.addEventListener("click", function () {
      userDisplay.classList.toggle("show-user-bar");
    });

    getAudioDevices();

    fetchUserChannel().then(status => {
      if (status === 'OK') {
        loadUserPlaylist();
      }
    });
  }
  if ((window.location.pathname === '/library/') && isAuthenticated) {
    let selected_Video_Id = null; // DONT DELETE!!!, this variable is used to declare selected_Video -id
    load_gallery();
  }
});

if (window.innerWidth < 768) {
  $(".mobile-menu").hide();
  // Toggle the div when a checkbox is clicked
  $("#menu-icon").on("click", function () {
    $(".mobile-menu").css("display", function () {
      return $(this).css("display") === "none" ? "flex" : "none";
    });
  });
}


async function startRecordModal() {
  // close modal if open
  const btnCloseAddNewChannelModal = document.getElementById('close-start-record-modal');
  btnCloseAddNewChannelModal.click();

  // Show the Add Channel Modal
  const createChannelModal = new bootstrap.Modal(document.getElementById('start-record-modal'));
  createChannelModal.show();
}



function displayTimer() {
  videoTimer.classList.add("show-cam-timer")
  // switchCamBtn.classList.add("show-cam-timer")
  timeInterval = setInterval(setTime, 1000);
  if (totalTime > 0) {
    totalTime = 0
  }
}

async function clearTimer() {
  videoTimer.classList.add("show-cam-timer")
  clearInterval(timeInterval);
  secondTime.innerHTML = '00';
  minuteTime.innerHTML = '00';
  hourTime.innerHTML = '00';
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
// diasble private if public is checked
function disablePrivandUnlist() {
  let publicChecked = publicVideosCheckbox.checked;
  let privateChecked = privateVideosCheckbox.checked;
  let unlistedChecked = unlistedVideosCheckbox.checked;
  if (publicChecked == true) {
    privateChecked == false
    unlistedChecked == false
    if (privateChecked == true) {
      privateVideosCheckbox.click()
    }
    if (unlistedChecked == true) {
      unlistedVideosCheckbox.click()
    }
  }
}
// diasble public if unlist is checked
function disablePublicandUnlist() {
  let publicChecked = publicVideosCheckbox.checked;
  let privateChecked = privateVideosCheckbox.checked;
  let unlistedChecked = unlistedVideosCheckbox.checked;
  if (privateChecked == true) {
    publicChecked == false
    unlistedChecked == false
    if (publicChecked == true) {
      publicVideosCheckbox.click()
    }
    if (unlistedChecked == true) {
      unlistedVideosCheckbox.click()
    }
  }
}

// diasble public and private if unlist is checked
function disablePubandPriv() {
  let publicChecked = publicVideosCheckbox.checked;
  let privateChecked = privateVideosCheckbox.checked;
  let unlistedChecked = unlistedVideosCheckbox.checked;
  if (unlistedChecked == true) {
    publicChecked == false
    privateChecked == false
    if (publicChecked == true) {
      publicVideosCheckbox.click()
    }
    if (privateChecked == true) {
      privateVideosCheckbox.click()
    }
  }
}

// Generate random string for appending to file name
generateString(6).then((randomString) => {
  fileRandomString = randomString;
})

// show select camera modal
async function showCameraModal() {
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

// show select audio modal
async function showAudioModal() {
  let audioSetting = audioCheckbox.checked;
  if (audioSetting == true) {
    // close modal if open
    const btnCloseAudioModal = document.getElementById('closeAudioModal');
    btnCloseAudioModal.click();

    // Show modal
    const showAudio = new bootstrap.Modal(document.getElementById('audioModal'));
    showAudio.show();
  } else {
    // Show modal
    const showAudio = new bootstrap.Modal(document.getElementById('audioModal'));
    showAudio.hide();
  }
  await microphoneStatus()
}
// document.getElementById('closeAudioModal').addEventListener('click', () => audioCheckbox.checked = false);
// document.getElementById('choose-audio').addEventListener('click', () => {
//   const audioSourceSelect = document.getElementById('audio-source');
//   const selectedValue = audioSourceSelect.value;

//   if (selectedValue) {
//     audioCheckbox.checked = true;
//   }
// });

// document.getElementById('closecameraModal').addEventListener('click', () => cameraCheckbox.checked = false);
// document.getElementById('choose-camera').addEventListener('click', () => {
//   const videoSourceSelect = document.getElementById('video-source');
//   const selectedValue = videoSourceSelect.value;
//   if (selectedValue) {
//     cameraCheckbox.checked = true;
//   }
// });
/**
 * Gets the webcam stream based on the provided media constraints.
 * Sets the stream as the source for the HTML video element.
 * Returns the obtained webcam stream.
 */
async function getWebcamStream(currentMediaConstraints) {
  try {
    webcamStream = await navigator.mediaDevices.getUserMedia(currentMediaConstraints);

    video.srcObject = stream;
    video.muted = true;

    return webcamStream;
  } catch (err) {
    const msg = "STATUS: Error while getting webcam stream.";
    document.getElementById("app-status").innerHTML = msg;

    await resetStateOnError();
    alert("Error while getting webcam stream!\n -Please give permission to webcam or mic when requested.\n -Try to start the recording again.");
  }
}

/**
 * Retrieves the audio devices and populates the audio selection dropdown.
 */
async function getAudioDevices() {
  try {
    const mediaDevices = await navigator.mediaDevices.enumerateDevices();
    const audioDevices = mediaDevices.filter(device => device.kind === 'audioinput');

    selectAudio.innerHTML = '';

    audioDevices.forEach((audioDevice, index) => {
      const option = document.createElement('option');
      option.value = audioDevice.deviceId;
      const label = audioDevice.label || `Audio ${index + 1}`;
      const textNode = document.createTextNode(label);
      option.appendChild(textNode);
      selectAudio.appendChild(option);

      if (option.value === 'default') {
        option.selected = true;
      }
    });
  } catch (err) {
    console.error('Error while retrieving audio devices:', err);
  }
}
// Call the function to populate the audio selection dropdown


/**
 * Gets the screen recording stream.
* Sets the stream as the source for the HTML video element.
* Returns the obtained screen recording stream.
* @param {*} mediaConstraints
*/
async function getScreenStream(
  mediaConstraints = {
    video: {
      cursor: 'always',
      resizeMode: 'crop-and-scale'
    },
    audio: true
  }) {
  try {
    // Get the screen recording stream using the provided media constraints
    screenStream = await navigator.mediaDevices.getDisplayMedia(mediaConstraints);

    return screenStream;
  } catch (err) {
    const errorMsg = "Error while getting the screen stream.";
    document.getElementById("app-status").innerHTML = errorMsg;
    alert("An error occurred while getting the screen stream!\nPlease share your screen when requested and try starting the recording again.");
    resetStateOnError();
    throw new Error(errorMsg);
  }
}

// VOice mute/Unmute
async function microphoneStatus() {
  try {
    const microphoneBtn = document.getElementById('audio-settings');
    return !!microphoneBtn.checked;
  } catch (error) {
    console.error('Error getting microphone status: ', error);
  }
}

/**
 * Internal Polyfill to simulate
 * window.requestAnimationFrame
 * since the browser will kill canvas
 * drawing when tab is inactive
 */
const requestVideoFrame = function (callback) {
  return window.setTimeout(function () {
    callback(Date.now());
  }, 1000 / 60); // 60 fps - just like requestAnimationFrame
};

/**
 * Internal polyfill to simulate
 * window.cancelAnimationFrame
 */
const cancelVideoFrame = function (id) {
  clearTimeout(id);
};

/**
 * Stop all active streams and recording processes.
 * Resets the app state to the initial state.
 * Clears the progress bar.
 * Clears the recording timer.
 * Clears the recording timestamp.
 * Clears the recording data.
 * Clears the recording chunks.
*/
async function stopRecording() {
  recordingStoped = true;

  if (window.innerWidth < 768) {
    $(".main-content-check-boxes").fadeIn("slow");
  }
  $('.lower-nav').fadeIn('slow');

  try {
    clearInterval(networkTimer);
  } catch (error) {
    console.error("Error while stopping network timer!");
  }

  try {
    // Close the websocket and stop streaming
    await stopStreams();

    // Transition the broadcast to complete state
    await endBroadcast();
    await clearTimer();

    // Enable the start recording button
    document.getElementById("start").disabled = false;
    resetonStartRecording();

    // Show the upload in progress modal
    // let uploadModal = new bootstrap.Modal(document.getElementById('uploadInProgress'));
    // uploadModal.show();

    // Clear the progress bar
    globalProgress = 0;
    // await setProgressBarValue(globalProgress);

    // Check the settings
    const recordWebcam = cameraCheckbox.checked;
    const recordScreen = screenCheckbox.checked;

    // Initialize upload data object if null
    if (testRecordingData === null) {
      testRecordingData = new FormData();
    }

    // Add the selected playlist information as an object
    if (userPlaylistSelection !== null) {
      try {
        const Account_info = {
          'Channeltitle': channelTitle,
          'Playlist_title': userPlaylistSelection[currentRadioButtonID]
        };
        testRecordingData.set('Account_info', JSON.stringify(Account_info));
      } catch (error) {
        console.error("Error while adding Account_info to upload data.", error);
      }
    }

    // Set video YouTube links or file names
    const youtubeLink = "https://youtu.be/" + newBroadcastID;

    if (recordScreen && recordWebcam) {
      testRecordingData.set('merged_webcam_screen_file', youtubeLink);
      testRecordingData.set('screen_file', screenFileName);
      testRecordingData.set('webcam_file', webcamFileName);
    } else if (recordScreen) {
      testRecordingData.set('screen_file', youtubeLink);
    } else if (recordWebcam) {
      testRecordingData.set('webcam_file', youtubeLink);
    }

    // Append test details data
    testRecordingData.set('user_name', usernameValue);
    testRecordingData.set('test_description', testDescriptionValue);
    testRecordingData.set('test_name', testNameValue);
    testRecordingData.set('user_files_timestamp', filesTimestamp);

    // Send data to the server for storage
    sendAvailableData();
  } catch (error) {
    console.error("Error while stopping recording:", error);
  }
}


// ==========================================================================================
// ==========================================================================================
// ==========================================================================================
// ==========================================================================================
// ==========================================================================================

/**
 * Records the webcam stream.
 * This function captures the webcam stream based on the provided webcamMediaConstraints,
 * assigns it to the video element, and creates a MediaRecorder to handle the recording.
 * The recorded data is sent to the appropriate websockets based on the recording settings.
 */
async function recordWebcamStream() {
  try {
    // console.log('============== inside record wbcam screen ==================');

    webcamMediaConstraints = {
      video: videoConstraints,
      audio: true,
    };
    webcamStream = await navigator.mediaDevices.getUserMedia(webcamMediaConstraints);

    // console.log('=========== webcam strream gotten ===================');

    video.srcObject = webcamStream;
    video.muted = true;

    // Get the supported media type options
    options = await getSupportedMediaType();

    // Check if the required codecs are supported
    if (options === null) {
      // Alert the user if required codecs are not found
      alert("None of the required codecs was found!\n - Please update your browser and try again.");
      document.location.reload();
      return null;
    }
    webcamRecorder = new MediaRecorder(webcamStream, options);

    // console.log('========== webcam recorder ====================');

    return webcamRecorder;
  } catch (err) {
    console.error('Webcam stream error >>> ', err);
    // Handle errors during webcam recording
    document.getElementById("app-status").innerHTML = "STATUS: Error while recording webcam stream.";
    alert("Error while recording webcam stream.");
    await stopStreams();
    await resetStateOnError();

    return null;
  }
}

// ==========================================================================================
// ==========================================================================================
// ==========================================================================================
// ==========================================================================================
// ==========================================================================================
// Function to get the selected audio device
function getSelectedAudioDevice() {
  // const selectAudio = document.getElementById('select-audio');
  if (selectAudio) {
    const selectedDeviceId = selectAudio.value;
    return selectedDeviceId === 'default' ? { deviceId: 'default' } : { deviceId: selectedDeviceId };
  }
}

// Records the screen and audio
async function recordScreenAndAudio() {
  try {
    const screenStream = await getScreenStream();
    const recordAudio = await microphoneStatus();
    let stream = null;

    if (recordAudio) {
      const audioDevice = getSelectedAudioDevice(); // Get the selected audio device
      const audioStream = await getAudioStream(audioDevice);

      try {
        // Merge screen and audio streams
        const mergedAudioTracks = mergeAudioStreams(screenStream, audioStream);
        stream = new MediaStream([...screenStream.getVideoTracks(), ...mergedAudioTracks]);
      } catch (error) {
        stream = new MediaStream([...screenStream.getTracks(), ...audioStream.getTracks()]);
      }
    } else {
      stream = new MediaStream([...screenStream.getTracks()]);
    }

    const recordWebcam = cameraCheckbox.checked;
    video.srcObject = recordWebcam ? webcamStream : stream;
    video.muted = true;

    const options = await getSupportedMediaType();

    if (options === null) {
      alert("None of the required codecs were found!\nPlease update your browser and try again.");
      document.location.reload();
      return null;
    }
    const screenRecorder = new MediaRecorder(stream, options);

    return screenRecorder;
  } catch (err) {
    console.error("An error occurred while recording screen and audio:", err);
    document.getElementById("app-status").innerHTML = "STATUS: Error while recording screen and audio.";
    alert("Error while recording screen and audio.");
    return null;
  }
}

// Function to get audio stream based on selected device
async function getAudioStream(audioDevice) {
  try {
    const audioStream = await navigator.mediaDevices.getUserMedia({ audio: audioDevice });
    return audioStream;
  } catch (err) {
    console.error('Error while retrieving audio stream:', err);
    return null;
  }
}

// =========================================================================================
// =========================================================================================
// =========================================================================================
// =========================================================================================


/**
 * Performs camera and screen merge recording.
 * This function gets the screen recording stream, webcam stream,
 * and microphone stream (if enabled), and merges them into a single stream.
 * The merged stream is then displayed in the video element.
 * The merged stream is also recorded and sent to the appropriate websockets.
 */
async function newRecordWebcamAndScreen() {
  let merger;
  let webcamStreamWidth = 0;
  let webcamStreamHeight = 0;

  try {
    // Request permission for showing notifications
    showNotificationPermission = await Notification.requestPermission();

    webcamStream = await getwebcamStream();
    screenStream = await screenAndAudioStream();


    // Get supported media type options
    options = await getSupportedMediaType();
    // console.log('Video options:', options);

    const screenWidth = screen.width;
    const screenHeight = screen.height;

    // Check if camera checkbox is checked
    if (cameraCheckbox.checked) {
      webcamStreamWidth = Math.floor(0.17 * screenWidth);
      webcamStreamHeight = Math.floor((webcamStreamWidth * screenHeight) / screenWidth);
    } else {
      console.log('Camera Device Not Found');
    }

    // Get the width and height of the screen stream
    const videoTrack = screenStream.getVideoTracks()[0];
    const width = videoTrack.getSettings().width;
    const height = videoTrack.getSettings().height;
    // console.log('Width:', width);
    // console.log('Height:', height);

    const mergerOptions = {
      width: screenStream.width,
      height: screenStream.height, mute: true
    };

    // Create a VideoStreamMerger and add the screen stream
    merger = new VideoStreamMerger(mergerOptions);
    merger.addStream(screenStream,
      {
        x: 0, y: 0, width: merger.width, height: merger.height
      });

    // Check if camera stream is available and add it to the merger
    if (webcamStream && merger.height) {
      merger.addStream(webcamStream,
        {
          x: 0, y: merger.height - webcamStreamHeight,
          width: webcamStreamWidth, height: webcamStreamHeight, mute: true
        });
    }
    // else {
    //   console.log('Camera Stream not available or merger height not defined');
    // }

    // Start the merger and set the video source to the merged stream
    await merger.start();
    video.srcObject = merger.result;

    // Create a new MediaRecorder for the merged stream
    mergedStreamRecorder = new MediaRecorder(merger.result, options);

    return mergedStreamRecorder;
  } catch (err) {
    // Handle errors during recording
    document.getElementById("app-status").innerHTML = "STATUS: Error while recording merged stream.";
    // console.log("Merged stream recording stoped with the following error >> ", err);
    await stopStreams();
    await resetStateOnError();

    return null
  }

  async function screenAndAudioStream() {
    try {
      const screenStream = await getScreenStream();
      const recordAudio = await microphoneStatus();
      let stream = null;

      if (recordAudio) {
        const audioDevice = getSelectedAudioDevice();
        const audioStream = await getAudioStream(audioDevice);

        try {
          // Merge screen and audio streams
          const mergedAudioTracks = mergeAudioStreams(screenStream, audioStream);
          stream = new MediaStream([...screenStream.getVideoTracks(), ...mergedAudioTracks]);
        } catch (error) {
          stream = new MediaStream([...screenStream.getTracks(), ...audioStream.getTracks()]);
        }
      } else {
        stream = new MediaStream([...screenStream.getTracks()]);
      }
      return stream;
    } catch (err) {
      console.error("An error occurred while recording screen and audio:", err);
      document.getElementById("app-status").innerHTML = "STATUS: Error while recording screen and audio.";
      alert("Error while recording screen and audio.");

      return null;
    }
  }

  async function getwebcamStream() {
    webcamMediaConstraints = {
      video: videoConstraints, audio: true
    };
    // Capture the webcam stream based on webcamMediaConstraints
    webcamStream = await navigator.mediaDevices.getUserMedia(webcamMediaConstraints);
    return webcamStream;
  }

}

// =========================================================================================
// =========================================================================================
// =========================================================================================
// =========================================================================================


/**
 * Starts the recording process based on user settings.
 * It prepares the media constraints for webcam and screen recording.
 * It shows the creating broadcast modal.
 * It records the merged screen and webcam stream, or the webcam stream, or the screen stream.
 */
async function startRecording() {
  const startButton = document.getElementById('start');
  startButton.blur();

  try {
    [socket, socketType] = await createAllsockets();
    if (!socket) {
      throw new Error('No socket connection!');
    }

    showCreatingBroadcastModal(true);
    await createBroadcast(socket);
    showCreatingBroadcastModal(false);

    ecordWebcam = cameraCheckbox.checked;
    recordScreen = screenCheckbox.checked;
    let streamRecorder = null;

    if (recordScreen && recordWebcam) {
      streamRecorder = await newRecordWebcamAndScreen();
    } else if (!recordScreen && recordWebcam) {
      streamRecorder = await recordWebcamStream();
    } else if (recordScreen && !recordWebcam) {
      streamRecorder = await recordScreenAndAudio();
    }

    if (streamRecorder != null) {
      displayTimer();
      streamRecorder.start(200);
      await createRecordingTimestamp();
      recordinginProgress = true;

      if (window.innerWidth < 768) {
        $(".main-content-check-boxes").fadeOut("slow");
      }

      $('.lower-nav').fadeOut('slow');

      console.log('Streaming has started');

      streamRecorder.ondataavailable = (event) => {
        if ((recordinginProgress && event.data.size > 0) && (socket.readyState === WebSocket.OPEN)) {
          // console.log('================= message sent to server ===============')
          socket.send(event.data);
        }
      };

      streamRecorder.onstop = () => {
        recordinginProgress = false;
        document.getElementById("app-status").innerHTML = "STATUS: Recording stopped.";
      };
    }
  } catch (err) {
    handleRecordingError("Recording Error: " + err.message);
  }

  function handleRecordingError(errorMessage) {
    const msg = "STATUS: " + errorMessage;
    document.getElementById("app-status").innerHTML = msg;
    console.error(errorMessage);
    resetStateOnError();
    showErrorModal();
  }
}

/**
 * Validates the selected options for webcam and audio.
 */
async function validateAll() {

  if (!cameraCheckbox.checked && !screenCheckbox.checked) {
    let statusBar = document.getElementById("app-status");
    msg = "ERROR: No stream source selected, please choose either camera and or screen and try again";
    statusBar.innerHTML = msg;
    return;
  }
  // Check if audio recording is enabled
  const audio = audioCheckbox.checked;

  if (audio) {
    // Check the selected audio device
    if (selectAudio.value === '') {
      // Use the default audio device if none is selected
      audioConstraints.deviceId = { exact: 'default' };
    } else {
      // Use the selected audio device
      audioConstraints.deviceId = { exact: selectAudio.value };
    }
    // console.log(audioConstraints);
  }

  // Check if webcam recording is enabled
  const webCam = cameraCheckbox.checked;

  if (webCam) {
    let currentCameraIsValid = true;
    let cameraErrorMsg = '';

    // Check the selected camera
    if (selectVideo.value === 'environment') {
      // Use the environment camera
      currentCamera = 'environment';
      videoConstraints.facingMode = currentCamera;
      currentCameraIsValid = false; // Indicate that currentCamera is not valid
    } else if (selectVideo.value === 'user') {
      // Use the user camera
      currentCamera = 'user';
      videoConstraints.facingMode = currentCamera;
    } else {
      // Use the default camera ('user')
      currentCamera = 'user';
      videoConstraints.facingMode = currentCamera;
    }

    // Set the webcam media constraints
    webcamMediaConstraints = {
      video: videoConstraints,
      audio: audioConstraints
    };

    // Clear the camera error message
    document.getElementById('camera-error').innerHTML = cameraErrorMsg;

    // Perform further validation or actions
    validateModal();
  } else {
    // Perform further validation or actions without webcam recording
    validateModal();
  }
}

/**
 * Validates the modal inputs for test details.
* If all inputs are valid, it disables the start recording button, sets the video privacy status, and starts the recording.
*/

// hide errors on typing
function hideTestNameError(){
  document.querySelector("#test-name-error").innerHTML = ""
}
function hidePlaylistError(){
  document.querySelector("#playlist-error").innerHTML = ""
}


async function validateModal() {
  // Get permission to show notifications in system tray
  const showNotificationPermission = await Notification.requestPermission();
  // console.log("showNotificationPermission: ", showNotificationPermission);

  // Clear previous test data
  userPlaylistSelection = null;
  currentChannelTitle = null;
  usernameValue = null;
  testNameValue = null;
  testDescriptionValue = null;
  testRecordingData = null;

  // Validate current channel title
  let currentChannelTitleIsValid = true;
  currentChannelTitle = document.getElementById("selectChannel").name.trim();
  let channelTitleErrorMsg = "";

  if (currentChannelTitle === "") {
    channelTitleErrorMsg = "Please select one channel";
    currentChannelTitleIsValid = false;
  }
  document.getElementById("channelname-error").innerHTML = channelTitleErrorMsg;

  // Validate playlist name
  let playlistIsValid = true;
  userPlaylistSelection = document.getElementById("selectPlaylist").value.trim();
  let playlistError = "";

  if (userPlaylistSelection === "") {
    playlistError = "Please select a playlist";
    playlistIsValid = false;
  }
  document.getElementById("playlist-error").innerHTML = playlistError;

  // Validate username
  let docIsValid = true;
  // usernameValue = document.getElementById("username").name.trim();
  // let usernameErrorMsg = "";

  // if (usernameValue === "") {
  //   usernameErrorMsg = "Please fill in the username";
  //   docIsValid = false;
  // }

  // document.getElementById("username-error").innerHTML = usernameErrorMsg;

  // Validate test name
  let testNameIsValid = true;
  testNameValue = document.getElementById("test-name").value.trim().replace(/\s/g, "_");
  let testNameErrorMsg = "";

  if (testNameValue === "") {
    testNameErrorMsg = "Please fill in the test name";
    testNameIsValid = false;
  }

  // Check if test name starts with a number
  if (testNameValue.match(/^\d/)) {
    testNameErrorMsg = "Test name cannot start with a number";
    testNameIsValid = false;
  }

  document.getElementById("test-name-error").innerHTML = testNameErrorMsg;

  // Check if all inputs are valid
  if (testNameIsValid && currentChannelTitleIsValid && playlistIsValid) {
    // Disable the start recording button
    document.getElementById("start").disabled = true;

    // Set the video privacy status and start recording
    setVideoPrivacyStatus()
      .then(startRecording)
      .catch((err) => {
        console.error("Start recording error: ", err);
        resetStateOnError();
        showErrorModal();
      });
  }
}

/**
 * Send the available data to the server for storage.
 * This function sends the available data to the server for storage.
 * It sends the webcam stream, screen stream, and merged stream (if available).
 */
async function sendAvailableData() {
  try {
    let status = document.getElementById("app-status");
    document.querySelector('.record-btn').style.display = 'block';
    document.querySelector('.stop-btn').style.display = 'none';
    document.querySelector(".video-title").innerHTML = "";

    const csrftoken = await getCookie('csrftoken');

    status.innerText = "STATUS: Uploading files to server...";
    console.log('Uploading files to server...')

    if (testRecordingData !== null) {
      const fileUploadUrl = '/file/upload/';
      const response = await fetch(fileUploadUrl, {
        method: 'POST',
        headers: { 'X-CSRFToken': csrftoken },
        body: testRecordingData
      });

      const responseJson = await response.json();
      const responseStatus = response.status;
      if (responseStatus === 201) {
        status.innerHTML = "STATUS: Record data uploaded succesfully!";

        testNameValue = null;
        testRecordingData = null;

        webcamChunks = [];
        screenRecorderChunks = [];
        mergedStreamChunks = [];
        receivedTaskID = [];
        taskIDwasRreceived = false;
        userPlaylistSelection = null;
        channelTitle = null;

        // const btnCloseUploadigModal = document.getElementById('btnCloseUploadigModal');
        // btnCloseUploadigModal.click();

        // Show upload complete modal
        // const uploadCompleteModal = new bootstrap.Modal(document.getElementById('uploadComplete'));
        // uploadCompleteModal.show();

        try {
          const newFileLinks = responseJson;
          set_video_links(newFileLinks);
        } catch (error) {
          console.error("Error while setting video links: ", error);
        }
      } else {
        status.innerHTML = "STATUS: Files Upload Failed.";

        // Hide upload in progress modal
        // const btnCloseUploadigModal = document.getElementById('btnCloseUploadigModal');
        // btnCloseUploadigModal.click();

        // Check which error modal to show
        let errorMessage = null;
        if ("error_msg" in responseJson) {
          errorMessage = responseJson.error_msg;
        }

        if (errorMessage && errorMessage.includes("Failed to get")) {
          // Get task id that has error
          const faultyTaskIDArray = errorMessage.split(";");
          const faultyTaskID = faultyTaskIDArray[1]?.trim();
          cosole.log('');
          // 
        } else {
          console.error('Upload failed!!');
          // Show upload failed modal
          // const uploadFailedModal = new bootstrap.Modal(document.getElementById('uploadFailed'));
          // uploadFailedModal.show();
        }
      }
    }
  } catch (error) {
    console.error("Error while sending data:", error);
    msg = "STATUS: Files Upload Failed.";
    document.getElementById("app-status").innerHTML = msg;

    // Hide upload in progress modal
    // const btnCloseUploadigModal = document.getElementById('btnCloseUploadigModal');
    // btnCloseUploadigModal.click();

    // Show upload failed modal
    // const uploadFailedModal = new bootstrap.Modal(document.getElementById('uploadFailed'));
    // uploadFailedModal.show();
  }
}

/**
 * Resets the global variables and stops the recording on error.
 */
async function resetStateOnError() {
  console.error("Resetting state due to error");

  // Get the current recording settings
  const recordWebcam = cameraCheckbox.checked;
  const recordScreen = screenCheckbox.checked;

  // Update application status
  msg = "STATUS: Recording stopped due to error.";
  document.getElementById("app-status").innerHTML = msg;

  // Stop video display tracks
  stopVideoElemTracks(video);
  // Stop the webcam stream
  if (recordWebcam) {
    try {
      if (webcamRecorder && webcamRecorder.state === 'recording') {
        webcamRecorder.stop();
      }
      if (webcamRecorder && webcamRecorder.stream) {
        webcamRecorder.stream.getTracks().forEach(track => track.stop());
      }
    } catch (err) {
      console.error("Error while stopping webcam recorder: " + err.message);
    }
  }

  // Stop the screen stream
  if (recordScreen) {
    try {
      if (screenRecorder && screenRecorder.state === 'recording') {
        screenRecorder.stop();
      }
      if (screenRecorder && screenRecorder.stream) {
        screenRecorder.stream.getTracks().forEach(track => track.stop());
      }
    } catch (err) {
      console.error("Error while stopping screen recorder: " + err.message);
    }
  }

  // Stop the merged stream
  if (recordScreen && recordWebcam) {
    try {
      if (mergedStreamRecorder && mergedStreamRecorder.state === 'recording') {
        mergedStreamRecorder.stop();
      }
      if (mergedStreamRecorder && mergedStreamRecorder.stream) {
        mergedStreamRecorder.stream.getTracks().forEach(track => track.stop());

        screenStream.getTracks().forEach((track) => track.stop());

        webcamStream.getTracks().forEach((track) => track.stop())
      }
    } catch (err) {
      console.error("Error while stopping merged stream recorder: " + err.message);
    }
  }

  // Enable the start recording button
  const startButton = document.getElementById("start");
  if (startButton) {
    startButton.disabled = false;
  }

  // Close any open websockets
  try {
    if (appWebsocket && appWebsocket.readyState === WebSocket.OPEN) {
      appWebsocket.close();
    }
  } catch (error) {
    console.error("Error while closing appWebsocket");
  }
  try {
    if (webcamWebSocket && webcamWebSocket.readyState === WebSocket.OPEN) {
      webcamWebSocket.close();
    }
  } catch (error) {
    console.error("Error while closing webcamWebSocket");
  }
  try {
    if (screenWebSocket && screenWebSocket.readyState === WebSocket.OPEN) {
      screenWebSocket.close();
    }
  } catch (error) {
    console.error("Error while closing screenWebSocket");
  }


  // Reset the global variables
  usernameValue = null;
  testNameValue = null;
  testDescriptionValue = null;
  screenRecorderChunks = [];
  webcamChunks = [];
  mergedStreamChunks = [];
  testRecordingData = null;
  screenRecorder = null;
  mergedStreamRecorder = null;
  webcamStream = null;
  screenStream = null;
  audioStream = null;
  recordinginProgress = false;
  websocketReconnect = false;
  webcamMediaConstraints = {
    video: videoConstraints,
    audio: audioConstraints
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
  taskIDwasReceived = false;
  userPlaylistSelection = null;
  channelTitle = null;

  // Hide the creating broadcast modal
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

async function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
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

// Shows upload failed modal
async function showUploadFailedModal() {
  modalstate = document.getElementById('uploadFailed').classList.contains('show');
  if (modalstate != true) {
    let uploadFailedModal = document.getElementById('uploadFailed');
    uploadFailedModal.classList.add('show');
  }
}

/**
 * Set video links based on provided data.
 *
 * @param {Object} linksData - An object containing the video link data.
 * @param {string} linksData.webcam_file - The webcam video link.
 * @param {string} linksData.screen_file - The screen video link.
 * @param {string} linksData.merged_webcam_screen_file - The merged webcam and screen video link.
 * @param {string} linksData.beanote_file - The beanote file link.
 * @param {string} linksData.key_log_file - The key log file link.
 */
async function set_video_links(linksData) {
  try {
    let webcamLink = document.getElementById('webcam_link');
    let screenLink = document.getElementById('screen_link');
    let mergedLink = document.getElementById('merged_link');
    let beanoteFileLink = document.getElementById('beanote_file_link');
    let keyLogFileLink = document.getElementById('key_log_file_link');

    // Set links value, check if data exists first
    if (linksData.hasOwnProperty("webcam_file") && webcamLink) {
      webcamLink.value = linksData.webcam_file;
    }
    if (linksData.hasOwnProperty("screen_file") && screenLink) {
      screenLink.value = linksData.screen_file;
    }
    if (linksData.hasOwnProperty("merged_webcam_screen_file") && mergedLink) {
      mergedLink.value = linksData.merged_webcam_screen_file;
    }
    if (linksData.hasOwnProperty("beanote_file") && beanoteFileLink) {
      beanoteFileLink.value = linksData.beanote_file;
    }
    if (linksData.hasOwnProperty("key_log_file") && keyLogFileLink) {
      keyLogFileLink.value = linksData.key_log_file;
    }
  } catch (error) {
    console.error("Error occurred while setting video links:", error.message);
  }
}


// ==========================================================================================
// ==========================================================================================
// ==========================================================================================
// ==========================================================================================

/**
 * Creates a WebSocket connection to the server.
 * Determines the WebSocket protocol based on the current page protocol.
 * Creates the WebSocket endpoint URL and initializes a new WebSocket instance.
 * Handles the WebSocket events such as open, close, error, and message.
 */
async function createWebsocket(recordWebcam, recordScreen) {
  // Determine the WebSocket protocol based on the current page protocol
  const wsStart = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
  let socketType = '';
  let socket = null;
  const endpoint = wsStart + window.location.host + "/ws/app/";
  socket = new WebSocket(endpoint);

  if ((recordScreen && !recordWebcam) || (!recordScreen && recordWebcam)) {
    appWebsocket = socket;
    socketType = recordScreen ? 'screen' : 'webcam';
  } else if (recordScreen && recordWebcam) {
    webcamScreenWebSocket = socket;
    socketType = 'webcamScreen';
  }
  socket.onopen = (event) => {
    // console.log('Socket is open');
    const mediaFileName = testNameValue + "_" + filesTimestamp + "_" + socketType + ".webm";
    const socketMsg = "FILENAME," + mediaFileName;
    socket.send(socketMsg);
    // console.log('socket Message sent to server');
    document.getElementById("app-status").innerHTML = "STATUS: WebSocket created.";
    websocketReconnect = false;
  };

  socket.onmessage = function (event) {
    const receivedMsg = event.data;
    msgRcvdFlag = true;
    // console.log('socket on message >>>   ', receivedMsg);

    if (receivedMsg.includes("RTMP url received: rtmp://")) {
      recordinginProgress = true;
      // console.log('RTMLP received');
      document.getElementById("app-status").innerHTML = "STATUS: Recording in Progress.";
    }
  };

  socket.onerror = async function (event) {
    if (recordinginProgress && !recordingStoped) {
      try {
        console.log('WebSocket disconnected unexpectedly');
        console.log('Reconnecting websocket...');
        let reconnectionAttempts = 0;
        const maxReconnectionAttempts = 3;

        while (reconnectionAttempts < maxReconnectionAttempts) {
          try {
            [socket, socketType] = await createWebsocket(recordWebcam, recordScreen);
            recordinginProgress = true;
            console.log('WebSocket reconnected successfully');
            break;
          } catch (error) {
            console.error('WebSocket reconnection attempt failed:', error);
          }

          reconnectionAttempts++;
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        if (reconnectionAttempts === maxReconnectionAttempts) {
          stopRecording();
          throw new Error('WebSocket reconnection failed after multiple attempts');
        }
      } catch (error) {
        stopRecording();
        throw new Error('WebSocket reconnection process failed');
      }
    } else {
      stopRecording();
      document.getElementById("app-status").innerHTML = "STATUS: WebSocket creation error.";
      console.error("WebSocket creation error: ", event.message);
      resetStateOnError();
      showErrorModal();
    }
  };

  socket.onclose = function (evt) {
    recordinginProgress = false;
    stopRecording();
  };

  return [socket, socketType]
}

// ==========================================================================================
// ==========================================================================================
// ==========================================================================================
// ==========================================================================================

async function createBroadcast(socket) {
  url = "/youtube/createbroadcast/api/"
  let broadcast_data = new Object();
  broadcast_data.videoPrivacyStatus = videoPrivacyStatus;
  // console.log(videoPrivacyStatus);
  broadcast_data.testNameValue = testNameValue;
  broadcast_data.channel_title = currentChannelTitle;

  json_broadcast_data = JSON.stringify(broadcast_data);

  let csrftoken = await getCookie('csrftoken');

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
        return
      }
    })
    .catch((err) => {
      console.error("Broadcast creation error: ", err)
      resetStateOnError();
      showErrorModal();
    });

  if (broadcastCreated == true) {
    insertVideoIntoPlaylist(socket);
  }
}

async function endBroadcast() {
  url = "/youtube/transitionbroadcast/api/";
  let broadcast_data = new Object();
  broadcast_data.the_broadcast_id = newBroadcastID;
  broadcast_data.channel_title = currentChannelTitle;
  json_broadcast_data = JSON.stringify(broadcast_data);
  let csrftoken = await getCookie('csrftoken');
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
      // console.log("transition complete broadcast data: ", data);
    })
    .then(() => {
      // console.log("Broadcast Trasitioned to complete state!");
      const previewButton = document.getElementById('playback-video-button');
      previewButton.style.display = 'block';
    }
    )
    .catch((err) => {
      console.error("Broadcast Trasitioning to complete state failed!");
      // console.log('transiton broadcast error >>> ', err);
    });
}

async function goToPage(event) {
  //let youtubeLink = "https://youtu.be/9Kann9lg1O8";
  let youtubeLink = "https://youtu.be/" + newBroadcastID;
  window.open(youtubeLink, '_blank');
  return false;
}
// share youtube link
async function shareToFacebook() {
  let youtubeLink = "https://youtu.be/" + newBroadcastID;
  // Get name of the youtube video
  let videoTitle = document.getElementById("test-name").value;
  let finalvideoTitle = videoTitle.replace(/_/ig, " ");
  document.querySelector(".facebook").href = `https://www.facebook.com/sharer/sharer.php?u=${youtubeLink}&t=${finalvideoTitle}`;
}
async function shareToTwitter() {
  let youtubeLink = "https://youtu.be/" + newBroadcastID;
  // Get name of the youtube video
  let videoTitle = document.getElementById("test-name").value;
  let finalvideoTitle = videoTitle.replace(/_/ig, " ");
  document.querySelector(".twitter").href = `https://twitter.com/share?text=${finalvideoTitle}&url=${youtubeLink}&hashtags=${finalvideoTitle}`;
}
async function shareToLinkedin() {
  let youtubeLink = "https://youtu.be/" + newBroadcastID;
  // Get name of the youtube video
  let videoTitle = document.getElementById("test-name").value;
  document.querySelector(".linkedin").href = `https://www.linkedin.com/sharing/share-offsite?url=${youtubeLink}`;
}
async function shareToEmail() {
  //let youtubeLink = "https://youtu.be/9Kann9lg1O8";
  let youtubeLink = "https://youtu.be/" + newBroadcastID;
  // Get name of the youtube video
  let videoTitle = document.getElementById("test-name").value;
  let finalvideoTitle = videoTitle.replace(/_/ig, " ");
  document.querySelector(".envelope").href = `mailto=?subject='Watch My Video'&amp;body=${finalvideoTitle}%20${youtubeLink}`;
}
async function shareToWhatsapp() {
  //let youtubeLink = "https://youtu.be/9Kann9lg1O8";
  let youtubeLink = "https://youtu.be/" + newBroadcastID;
  // Get name of the youtube video
  let videoTitle = document.getElementById("test-name").value;
  let finalvideoTitle = videoTitle.replace(/_/ig, " ");
  document.querySelector(".whatsapp").href = `https://api.whatsapp.com/send?text=${finalvideoTitle}%20${youtubeLink}`;
}
async function copyLink() {
  let youtubeLink = "https://youtu.be/" + newBroadcastID;
  // Create a temporary input element to copy link
  var tempInput = document.createElement("input");
  tempInput.value = youtubeLink;
  document.body.appendChild(tempInput);
  tempInput.select();
  document.execCommand("copy");
  document.body.removeChild(tempInput);
  alert("Link copied to clipboard");
}


async function shareLinkModal() {
  // close modal if open
  const btnCloseTestDetailsModal = document.getElementById('close-share-link-modal');
  btnCloseTestDetailsModal.click();
  // Show modal
  const testDetailsModal = new bootstrap.Modal(document.getElementById('share-link-modal'));
  testDetailsModal.show();
}

// Shows upload failed modal
async function showErrorModal(liveStreamError = null, message = null) {
  let messageDisplay = document.getElementById('errorMessage');
  if (liveStreamError != null) {
    let errorModal = new bootstrap.Modal(document.getElementById('livestreamErrorModal'));
    // let msg_p = errorModal.querySelector('#livestreamErrorOccurred');
    document.querySelector('#livestreamErrorOccurred').innerHTML = liveStreamError;
    errorModal.show();
  } else {
    let errorModal = new bootstrap.Modal(document.getElementById('errorOccurred'));
    if (message != null) {
      messageDisplay.innerHTL = message
    }
    errorModal.show();
  }
}

// Timer to check network status every second
networkTimer = setInterval(() => {
  checkNetworkStatus();
}, 1000) // each 1 second

// Function to check network status
async function checkNetworkStatus() {
  let currentDateTime = new Date();
  let resultInSeconds = currentDateTime.getTime() / 1000;
  let timeNow = resultInSeconds;
  if (msgRcvdFlag === true) {
    lastMsgRcvTime = timeNow;
    msgRcvdFlag = false;
  } else {
    if (recordinginProgress === false) {
      lastMsgRcvTime = timeNow;
    } else if ((timeNow - lastMsgRcvTime) > 25) { // More than 25 secs
      msgRcvdFlag = false;
      lastMsgRcvTime = timeNow;
      // Stop recording due to network problem
      //clearInterval(networkTimer);
      // stopStreams();
      // resetStateOnError();
      //alert("Recording stopped due to network problem");
      //let errorModal = new bootstrap.Modal(document.getElementById('networkErrorOccurred'));
      //errorModal.show();

      // Show system tray notification and alert
      // showNetworkErrorOccurredModal();
    }
  }
}

// sets youtube video privacy status
async function setVideoPrivacyStatus() {
  // Check if we need to make videos public
  let makePublic = publicVideosCheckbox.checked;
  let privateVideo = privateVideosCheckbox.checked;
  let unlistedVideo = unlistedVideosCheckbox.checked;
  if (makePublic == true) {
    videoPrivacyStatus = "public";
  }
  else if (privateVideo == true) {
    videoPrivacyStatus = "private";
  }
  else if (unlistedVideo == true) {
    videoPrivacyStatus = "unlisted";
  }
  else {
    videoPrivacyStatus = "unlisted";
  }
}

/**
 * Stops the recording streams.
 */
async function stopStreams() {

  let video = document.getElementById('video')
  // Stop video display tracks
  await stopVideoElemTracks(video);
  // recording timer
  try {
    clearInterval(networkTimer);
  } catch (error) {
    console.error("Error while stopping network timer!");
  }
  // Synchronized recording stop
  recordingSynched = false;
  logKeyboard = false;
  recordWebcam = cameraCheckbox.checked;
  recordScreen = screenCheckbox.checked;

  // Stop the webcam stream
  if (!recordScreen && recordWebcam) {
    try {
      if (webcamRecorder && webcamRecorder.stream) {
        webcamRecorder.stream.getTracks().forEach(track => track.stop());
      }
    } catch (err) {
      console.error("Error while stopping webcam recorder: " + err.message);
    }
  }

  // Stop the screen stream
  if (recordScreen && !recordWebcam) {
    try {
      if (screenRecorder && screenRecorder.stream) {
        screenRecorder.stream.getTracks().forEach(track => track.stop());
      }
    } catch (err) {
      console.error("Error while stopping screen recorder: " + err.message);
    }
  }

  // Stop the merged stream
  if (recordScreen && recordWebcam) {
    try {
      if (mergedStreamRecorder && mergedStreamRecorder.stream) {
        mergedStreamRecorder.stream.getTracks().forEach(track => track.stop());
        screenStream.getTracks().forEach((track) => track.stop());
        webcamStream.getTracks().forEach((track) => track.stop())
      }
    } catch (err) {
      console.error("Error while stopping merged stream recorder: " + err.message);
    }
  }
}

// Creates all the required websockets
async function createAllsockets() {
  recordWebcam = cameraCheckbox.checked;
  recordScreen = screenCheckbox.checked;
  let socketX = null;
  let socketTypeX = null;
  try {
    // Create youtube websocket first, then others follow on success
    [socketX, socketTypeX] = await createWebsocket(recordWebcam, recordScreen);
    return [socketX, socketTypeX];
  } catch (err) {
    console.error("Error while creating sockets: " + err.message);
    // Tell user, stop the recording.
    resetStateOnError();
    showErrorModal();
  }
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

// Stops video element tracks
async function stopVideoElemTracks(videoElem) {
  // Actual video display element
  try {
    let tracks = videoElem.srcObject.getTracks();
    tracks.forEach((track) => track.stop());
    videoElem.srcObject = null;
  } catch (error) {
    console.error("Error while stopping video display tracks: ", error.message)
  }
}

// Inserts a video into a youtube playlist
async function insertVideoIntoPlaylist(socket) {
  // hide the creating broadcast modal
  let playlistItemsInsertURL = '/youtube/playlistitemsinsert/api/';
  let csrftoken = await getCookie('csrftoken');
  let responseStatus = null;
  await fetch(playlistItemsInsertURL, {
    method: 'POST',
    body: JSON.stringify({
      videoId: newBroadcastID,
      playlistId: userPlaylistSelection,
      channel_title: currentChannelTitle
    }),
    headers: {
      "Content-type": "application/json; charset=UTF-8",
      'X-CSRFToken': csrftoken
    }
  })
    .then(response => {
      responseStatus = response.status;
      return response.json();
    })
    .then((json) => {
      if (responseStatus == 200) {
        msg = "STATUS: Video Inserted Into User Playlist."
        document.getElementById("app-status").innerHTML = msg;

        // Insert video into daily playlist
        if (todaysPlaylistId != null) {
          insertVideoIntoTodaysPlaylist(socket);
        } else {
          sendRTMPURL(socket);
        }

      } else {
        // Server error message
        // console.log("Server Error Message: ", json)
        msg = "STATUS: Failed to Insert Video Into User Playlist."
        document.getElementById("app-status").innerHTML = msg;

        // Show error modal
        // playlistInsertVideoErrorModal();
      }
    })
    .catch(error => {
      console.error(error);
      msg = "STATUS: Failed to Insert Video Into User Playlist."
      document.getElementById("app-status").innerHTML = msg;

      // Show error modal
      // playlistInsertVideoErrorModal();
    });
  // display some buttons and remove some
  displayUtilities()
}

// Inserts a video into the current day's youtube playlist
async function insertVideoIntoTodaysPlaylist(socket) {
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
      return response.json();
    })
    .then((json) => {
      if (responseStatus == 200) {
        msg = "STATUS: Video Inserted Into Daily Playlist."
        document.getElementById("app-status").innerHTML = msg;

        // Proceed to send RTMP URL
        sendRTMPURL(socket);

      } else {
        // Server error message
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
async function sendRTMPURL(socket) {
  // displayTimer();
  showCreatingBroadcastModal(false);
  if (socket != null && socket.readyState === WebSocket.OPEN) {
    // Check if we need to add audio stream
    recordAudio = microphoneStatus();
    if (recordAudio == true) {
      let msg = "browser_sound," + newRtmpUrl;
      await socket.send(msg)
      // console.log('<=== RTMP sent with audio ====>');
    } else {
      await socket.send(newRtmpUrl);
      // console.log('<=== RTMP sent ====>');
    }
    displayUtilities();
  }
  // else {
  //   console.log('Error: Unable. sent RTMP URL, websocket not connected');
  // }
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
  const creatingBroadcastModal = new bootstrap.Modal(document.getElementById('creatingBroadcastModal'));
  const btnCloseCreatingBroadcastModal = document.getElementById('btnCloseCreatingBroadcastModal');
  if (showModal) {
    // close modal if open
    btnCloseCreatingBroadcastModal.click();
    controller.abort();

    // Show modal
    creatingBroadcastModal.show();
  } else {
    // close modal
    btnCloseCreatingBroadcastModal.click();
    controller.abort()
  }
}

// close youtube list selection modal
async function closeYoutubePlaylistSelectionModal() {
  resetStateOnClosingPlaylistModal()
}

// reset state on closing youtube playlist modal
async function resetStateOnClosingPlaylistModal() {
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
  webcamStream = null;
  screenStream = null;
  audioStream = null;
  recordinginProgress = false;
  //websocketReconnect = false;
  webcamMediaConstraints = {
    video: videoConstraints, audio: audioConstraints
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
async function showCreatingNewPlaylistModal() {
  // close modal if open
  const btnCloseNewPlaylistDetailsModal = document.getElementById('close-new-playlist-details-modal');
  btnCloseNewPlaylistDetailsModal.click();

  // Show modal
  const creatingNewPlaylistModal = new bootstrap.Modal(document.getElementById('new-playlist-details-modal'));
  creatingNewPlaylistModal.show();

}

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
  /*if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
    options = {
      mimeType: 'video/webm; codecs=vp9',
      videoBitsPerSecond: 3000000
    };
    return options;
  } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')) {
    options = {
      mimeType: 'video/webm; codecs=vp8,opus',
      videoBitsPerSecond: 3000000
    };
    return options;
  } else {
    return null;
  }*/

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


// ====================================== CHANNEL CODE SECTION ============================================

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
    fetch("/", {
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
          // console.log(resp['message'])
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
  document.querySelector('#audio-settings').disabled = true;
  document.querySelector('#public-videos').disabled = true;
  document.querySelector('#private-videos').disabled = true;
  document.querySelector('#unlisted-videos').disabled = true;
  document.querySelector('#audio-settings').disabled = true;
  // document.querySelector('#screen-recording').disabled = true;
  document.querySelector('#webcam-recording').disabled = true;

  // clear navbar forms
  // Enable share records button
  if (publicVideosCheckbox.checked || unlistedVideosCheckbox.checked) {
    btnShareRecords.style.display = "block";
  } else {
    btnShareRecords.style.display = "none";
  }

  // Get name of the youtube video
  let finalvideoTitle = document.getElementById("test-name").value.trim().replace(/_/ig, " ");
  document.querySelector(".video-title").innerHTML = `<h2>${finalvideoTitle}</h2>`
}

/* Fetch channels for the user */
async function fetchUserChannel() {
  try {
    const channelsApiUrl = '/youtube/channels/api';
    let statusBar = document.getElementById("app-status");

    const response = await fetch(channelsApiUrl, {
      method: 'GET',
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized');
      } else if (response.status === 404) {
        throw new Error('Not Found');
      } else {
        throw new Error('Error: ' + response.status);
      }
    }

    const data = await response.json();
    const userChannels = data;

    statusBar.innerHTML = "STATUS: User Channel Received.";

    userChannels.forEach((obj) => {
      const opt = document.createElement("option");
      opt.value = obj.channel_title;
      opt.innerHTML = obj.channel_title;
      channelSelect.append(opt);
    });

    // Set the initial value for channelSelect
    if (userChannels.length > 0) {
      channelSelect.value = userChannels[0].channel_title;
      channelSelect.name = userChannels[0].channel_title;
    }

    return 'OK';
  } catch (error) {
    console.error(error);
    const statusBar = document.getElementById("app-status");
    const channelSelect = document.getElementById("your-channel-select");

    if (error.message === 'Unauthorized') {
      statusBar.innerHTML = 'ERROR: Account is not a Google account';
      channelSelect.value = 'Channel Unavailable';
    } else if (error.message === 'Not Found') {
      statusBar.innerHTML = 'ERROR: Account does not have a created channel';
      channelSelect.value = 'Channel Unavailable';
    } else {
      statusBar.innerHTML = 'ERROR: Unable to fetch the channel, please contact the admin';
      channelSelect.value = 'Channel Unavailable';
    }

    return 'Error';
  }
}

async function loadUserPlaylist() {
  let channel = document.getElementById("selectChannel").name;
  if (channel) {
    fetchUserPlaylists()
  }
}

async function fetchUserPlaylists() {
  let statusBar = document.getElementById("app-status");
  let selectUserPlaylist = document.querySelector(".selectPlaylist")

  await fetch('/youtube/fetchplaylists/api/', { method: 'GET', })
    .then(response => {
      responseStatus = response.status;
      if (response.ok) {
        if (response.status === 204) {
          throw new Error('No Content');
        } else {
          return response.json();
        }
      } else {
        throw new Error('Server side error')
      }
    })
    .then((json) => {
      msg = "STATUS: Playlists Received."
      statusBar.innerHTML = msg;
      let userPlaylists = json.user_playlists;
      for (const key in userPlaylists) {
        let opt = document.createElement("option");
        opt.innerHTML = userPlaylists[key];
        opt.value = key;
        selectUserPlaylist.append(opt)
      }
      // Get today's playlist id
      let todaysPlaylistObject = json.todays_playlist_dict
      todaysPlaylistId = todaysPlaylistObject.todays_playlist_id
    }
    )
    .catch(error => {
      console.error(error);
      if (error.message === 'No content') {
        msg = "ERROR: The channel does not have any playlists created.";
        statusBar.innerHTML = msg;
      } else {

        msg = "ERROR: Unable to fetch playlist please contact the admin";
        statusBar.innerHTML = msg;
      }
    });
}

async function load_gallery() {
  // console.log('welcome Load Gallery Function');
  const playlistsResponse = await fetch('/youtube/fetchplaylists/api/', { method: 'GET' });

  if (playlistsResponse.ok) {
    const playlistsData = await playlistsResponse.json();
    let playlistsDict = playlistsData.user_playlists;
    // console.log('playlistsDict :', playlistsDict);
    const playlistIds = Object.keys(playlistsDict);

    // Display playlist names in the HTML select tag
    const selectUserPlaylist = document.getElementById("userLibraryPlaylist");
    selectUserPlaylist.innerHTML = '';

    for (let playlistId of playlistIds) {
      let playlistName = playlistsDict[playlistId];
      if (playlistName !== '') {
        const opt = document.createElement('option');
        opt.text = playlistName;
        opt.value = playlistId;
        selectUserPlaylist.add(opt);
      }
    }

    // Add event listener for playlist selection
    selectUserPlaylist.addEventListener('change', async () => {
      const playlist_id = selectUserPlaylist.value;
      currentPlaylistId = playlist_id;
      await load_videos(playlist_id);
      await play_first_video();
      document.querySelector('#lib-delete-button').style.display = 'block';

    });

    selectUserPlaylist.dispatchEvent(new Event('change'));

  } else {
    throw new Error('Failed to fetch playlists.');
  }
}

async function play_first_video() {
  const videos = document.getElementById("all_video");
  if (videos.length > 0) {
    const video_id = videos.options[0].value;
    selected_Video_Id = video_id;
    await play(video_id);
  }
}

async function load_videos(playlist_id) {
  // console.log('welcome Load Videos');
  let response = await fetch('/youtube/videos/api/', { method: 'GET' });

  if (response.ok) {
    const playlistItemsData = await response.json();
    let playlist_videos = playlistItemsData;
    // console.log('playlist_videos 3698 :', playlist_videos);
    if (playlist_videos.length === 0) {
      console.log('No videos found in the playlist.');
      return;
    }

    let playlistObject = playlist_videos.find(videoObject => videoObject['playlistId'] === playlist_id);
    // console.log('playlist objects >>> ', playlistObject)
    let playlistVideos = playlistObject.videos;
    // console.log('playlist_videos 3698 :', playlistVideos);
    if (playlistVideos.length === 0) {
      console.log('No videos found in the playlist.');
      return;
    }

    const videos = []; // Array to store the videos

    // Iterate over the playlist videos and extract necessary information
    playlistVideos.forEach(video => {
      const videoId = video.videoId;
      const videoTitle = video.videoTitle;
      const videoThumbnail = video.videoThumbnail;
      const videoDescription = video.videoDescription;

      // Create an object to represent the video
      const videoObject = {
        id: videoId,
        title: videoTitle,
        thumbnail: videoThumbnail,
        description: videoDescription
      };
      // Add the video object to the videos array
      videos.push(videoObject);
    });
    videos
    // console.log('Videos 3724:', videos)
    // Populate the select element with video titles
    const selectElement = document.getElementById('all_video');
    selectElement.innerHTML = ''; // Clear existing options
    videos.forEach(video => {
      const option = document.createElement('option');
      option.value = video.id;
      option.text = video.title;
      selectElement.appendChild(option);
    });
    // Add event listener to the select element
    selectElement.addEventListener('change', function () {
      const selectedVideoId = this.value;

      selected_Video_Id = selectedVideoId;
      // console.log('selected video id > ', selected_Video_Id);

      const selectedVideo = videos.find(video => video.id === selectedVideoId);
      if (selectedVideo) {
        play(selectedVideo.id);
      }
    });

  }
}

async function play(videoId, playerElementID = 'player') {
  // console.log('Playing video:', title, 'with videoId:', videoId)
  const playerElement = document.getElementById(playerElementID);
  if (!window.YT) {
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    window.onYouTubeIframeAPIReady = createPlayer;
  } else {
    if (player) {
      await player.loadVideoById(videoId);
    } else {
      createPlayer();
    }
  }

  function createPlayer() {
    player = new YT.Player(playerElement, {
      videoId: videoId,
      events: {
        onReady: function (event) {
          event.target.playVideo();
          // console.log('Playing video:', title);
        }
      }
    });
  }
}

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
  document.querySelector('#unlisted-videos').disabled = false;

}

// ===================================================================================================
const VideoPreviewModal = new bootstrap.Modal(document.getElementById('preview-video-modal'));
const btnCloseVideoPreviewModal = document.getElementById('close-preview-video-modal');
const btnDeleteVideoPreviewModal = document.getElementById('preview-btn-delete');
const okBotton = document.getElementById('preview-btn-ok');
const youtubePreview = document.getElementById('youtube-preview');
const video_Id = newBroadcastID;


var tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

// Function to open the modal
function openModal(videoId) {
  // Load YouTube video preview
  const youtubePreview = document.getElementById('youtube-preview');
  youtubePreview.innerHTML = `
    <iframe 
      width="100%" 
      height="100%" 
      src="https://www.youtube.com/embed/${videoId}" 
      frameborder="0" 
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
      allowfullscreen
    ></iframe>
  `;
}

async function previewVideo() {
  const video_Id = newBroadcastID;
  // console.log('==== Video Id >>> ', video_Id);

  // Close modal if open
  btnCloseVideoPreviewModal.click();

  // Show modal
  VideoPreviewModal.show();

  openModal(video_Id);

  okBotton.addEventListener('click', () => {
    youtubePreview.innerHTML = '';
    btnCloseVideoPreviewModal.click()
  });
  btnCloseVideoPreviewModal.addEventListener('click', () => {
    youtubePreview.innerHTML = '';
    btnCloseVideoPreviewModal.click()
  });
  btnDeleteVideoPreviewModal.addEventListener('click', () => {
    openModal_delete();
  });
}

async function deleteVideo(video_Id) {

  let csrftoken = await getCookie('csrftoken');
  // console.log('video id ', video_Id)
  // Function to handle the fetch response
  function handleResponse(response) {
    if (response.ok) {
      // Successful response
      try {
        let statusBar = document.getElementById("app-status");
        msg = 'SUCCESS: Video deleted successfully';
        statusBar.innerHTML = msg;
      }
      catch {
        console.log('unable to log delete success message');
      }

      return response.json();
    } else if (response.status === 401) {
      // Unauthorized error
      throw new Error('Account is not a Google account');
    } else {
      // Other error
      throw new Error('An error occurred while deleting the video');
    }
  }

  // Fetch request to delete the video
  fetch('/youtube/delete-video/api/', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': csrftoken,
    },
    body: JSON.stringify({
      video_id: video_Id,
    }),
  })
    .then(handleResponse)
    .then(data => {
      // // Success response
      console.log('Video deleted succesfully');
      // console.log('Delete Response Message >> ', data.message);
      // console.log('Delete data.response >> ', data.response);
    })
    .catch(error => {
      // Error response
      console.error(error);
    });
}

// =============================================================
function openModal_delete() {
  const modal = document.getElementById('confirmationModal_delete');
  modal.style.display = 'block';
  if (window.location.pathname === '/library/' && isAuthenticated) {
    // console.log('selected video id > ', selected_Video_Id);
  }
}

function closeModal_delete() {
  var modal = document.getElementById('confirmationModal_delete');
  modal.style.display = 'none';
}

function deleteItem_delete() {
  const video_Id = (window.location.pathname === '/library/' && isAuthenticated)
    ? selected_Video_Id
    : newBroadcastID;

  // Perform delete operation here
  deleteVideo(video_Id)
    .then(() => {
      closeModal_delete();
      if (window.location.pathname === '/library/' && isAuthenticated) {
        const videoPlayer = document.getElementById('player');
        videoPlayer.innerHTML = ''
      } else {
        youtubePreview.innerHTML = '';
        btnCloseVideoPreviewModal.click();
      }
    });
  console.log('Item deleted');
}


// Function to check if the user's device is mobile
function isMobileDevice() {
  return /Mobi|Android/i.test(navigator.userAgent);
}

// Function to remove the "Screen" option if the device is mobile
function removeScreenOption() {
  var screenCheckbox = document.getElementById("screen-recording");
  if (isMobileDevice()) {
    var screenLabel = screenCheckbox.parentNode;
    screenLabel.parentNode.removeChild(screenLabel);
  }
}

// Call the function when the page loads
window.onload = function () {
  removeScreenOption();
};
