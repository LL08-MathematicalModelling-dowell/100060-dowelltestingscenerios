// Some app controls
const video = document.getElementById('video')
const cameraCheckbox = document.getElementById('webcam-recording')
const screenCheckbox = document.getElementById('screen-recording')
const keyLogCheckbox = document.getElementById('key-logging')
const audioCheckbox = document.getElementById('audio-settings')
const publicVideosCheckbox = document.getElementById('public-videos')

// App global variables
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
let webcamMediaConstraints = {
  video: true, audio: true
};
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
let btnViewRecords = document.getElementById('view_records');
let newRtmpUrl = null;
let websocketReconnect = false;
let recordinginProgress = false;
let videoPrivacyStatus = "private";
let lastMsgRcvTime = 0;
let msgRcvdFlag = false;
let networkTimer = false;
let filesTimestamp = null;
let screenFileName = null;
let webcamFileName = null;
// Show selenium IDE installation modal, if not disabled
let dontShowSeleniumIDEModalAgain = localStorage.getItem("dontShowSelIDEInstallAgain");
if (dontShowSeleniumIDEModalAgain != "true") {
  let seleniumIDEModal = new bootstrap.Modal(document.getElementById('seleniumIDEModal'));
  seleniumIDEModal.show();
}

// Generate random string for appending to file name
generateString(6).then((randomString) => {
  fileRandomString = randomString;
})

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

// Gets screen recording stream
async function captureScreen(mediaConstraints = {
  video: {
    cursor: 'always',
    resizeMode: 'crop-and-scale'
  },
  audio: true
}) {

  try {
    const screenStream = await navigator.mediaDevices.getDisplayMedia(mediaConstraints)

    return screenStream
  }
  catch (err) {
    let msg = "STATUS: Error while getting screen stream."
    document.getElementById("app-status").innerHTML = msg;
    alert("Error while getting screen stream!\n -Please share screen when requested.\n -Try to start the recording again.");
    // Tell user, stop the recording.
    resetStateOnError();
  }
}

// Records webcam and audio
async function recordStream() {
  webCamStream = await captureMediaDevices(webcamMediaConstraints);

  video.src = null
  video.srcObject = webCamStream
  video.muted = true

  webcamRecorder = new MediaRecorder(webCamStream, {
    mimeType: 'video/webm;codecs=h264',
    videoBitsPerSecond: 3000000
  });

  webcamRecorder.ondataavailable = event => {
    if(recordinginProgress==true){
      if ((event.data.size > 0) && (recordingSynched == true) && (streamWebcamToYT == true)) {
        //webcamChunks.push(event.data);
        appWebsocket.send(event.data);
      } else if ((event.data.size > 0) && (recordingSynched == true) && (streamScreenToYT == false)) {
        //console.log("Sending screen data to webcam websocket");
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

// Records merged screen and webcam stream
async function recordMergedStream() {
  try {
    var merger = new VideoStreamMerger();

    // Set width and height of merger
    let screenWidth = screen.width;
    let screenHeight = screen.height;
    merger.setOutputSize(screenWidth, screenHeight);

    // Check if we need to add audio stream
    let recordAudio = audioCheckbox.checked;
    let muteState = !recordAudio;
    //console.log("muteState: ",muteState)

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
    let webcamStreamWidth = Math.floor(0.15 * screenWidth);
    //console.log("webcamStreamWidth: " + webcamStreamWidth);
    let webcamStreamHeight = Math.floor((webcamStreamWidth * screenHeight) / screenWidth);
    //console.log("webcamStreamHeight: " + webcamStreamHeight);

    // Add the webcam stream. Position it on the bottom left and resize it to 0.15 of screen width.
    merger.addStream(webCamStream, {
      x: 0,
      y: merger.height - webcamStreamHeight,
      width: webcamStreamWidth,
      height: webcamStreamHeight,
      mute: false
    })

    // Start the merging. Calling this makes the result available to us
    merger.start()

    // We now have a merged MediaStream!
    const mergedStream = merger.result
    mergedStreamRecorder = new MediaRecorder(mergedStream, {
      mimeType: 'video/webm;codecs=h264',
      videoBitsPerSecond: 3000000
    });

    mergedStreamRecorder.ondataavailable = event => {
      if(recordinginProgress==true){
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

    //mergedStreamRecorder.start(200);
  }
  catch (err) {
    let msg = "STATUS: Error while recording merged stream stream."
    document.getElementById("app-status").innerHTML = msg;
    alert("Error while recording merged stream stream.");
    console.log("Error while recording merged stream stream: " + err.message);

    // Reset app status
    resetStateOnError();
  }
}


// Stops webcam and screen recording
async function stopRecording() {
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

  // Enable start recording button
  document.getElementById("start").disabled = false;

  // Enable view records button
  if (publicVideosCheckbox.checked) {
    btnViewRecords.disabled = false;
  } else {
    btnViewRecords.disabled = true;
  }


  // Show upload in progress modal
  let uploadModal = new bootstrap.Modal(document.getElementById('uploadInProgress'));
  uploadModal.show();

  // Clear the progress bar
  let globalProgress = 0;
  await setProgressBarValue(globalProgress);

  // Check the settings
  let recordWebcam = cameraCheckbox.checked;
  let recordScreen = screenCheckbox.checked;
  let logKeyboard = keyLogCheckbox.checked;

  // Initialize upload data object if null
  if (testRecordingData == null) {
    testRecordingData = new FormData();
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

  // Check if we need to add audio stream
  let recordAudio = audioCheckbox.checked;
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

      //console.log('Tracks to add to stream', tracks);
      stream = new MediaStream(tracks);
    } catch (error) {
      console.error("Error while creating merged audio streams: ", error)
      stream = new MediaStream([...screenStream.getTracks(), ...audioStream.getTracks()]);
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

  screenRecorder = new MediaRecorder(stream, {
    mimeType: 'video/webm;codecs=h264',
    videoBitsPerSecond: 3000000
  });

  screenRecorder.ondataavailable = event => {
    //console.log("Data available");
    if(recordinginProgress==true){
      if ((event.data.size > 0) && (recordingSynched == true) && (streamScreenToYT == true)) {
        appWebsocket.send(event.data);
      } else if ((event.data.size > 0) && (recordingSynched == true) && (streamScreenToYT == false)) {
        //console.log("Sending screen data to screen websocket");
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
    msg = "STATUS: Screen Recording Stopped."
    document.getElementById("app-status").innerHTML = msg;
  }

  //screenRecorder.start(200)
}

// Checks recording settings and starts the recording
async function startRecording() {

  // Remove focus from start recording button
  document.getElementById('start').blur();

  // Generate random string for appending to file name
  generateString(6).then((randomString) => {
    fileRandomString = randomString;
    //console.log("fileRandomString: ", fileRandomString)
  })

  // Enable or disable audio recording
  try {
    let recordAudio = audioCheckbox.checked;

    if (recordAudio == true) {
      // Enable audio recording for webcam
      webcamMediaConstraints = {
        video: true, audio: true
      };

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
        video: true, audio: false
      };

      // Disable audio recording for screen recording
      screenAudioConstraints = {
        audio: false,
        video: false
      };
    }
  }
  catch (err) {
    let msg = "STATUS: Screen recording Error."
    document.getElementById("app-status").innerHTML = msg;
    console.error("Screen recording Error: " + err.message);
  }

  // Record merged screen and webcam stream
  let recordWebcam = cameraCheckbox.checked;
  let recordScreen = screenCheckbox.checked;
  if ((recordScreen == true) && (recordWebcam == true)) {
    try {
      await recordStream();
      //console.log("Done with webcam and audio.")
      await recordScreenAndAudio();
      //console.log("Done with screen and audio.")
      await recordMergedStream();
      //console.log("Done with merged.")

      // Synchronize recording
      recordingSynched = true;
      streamWebcamToYT = false;
      streamScreenToYT = false;
      streamMergedToYT = true;
      /*screenRecorder.start(200);
      webcamRecorder.start(200);
      mergedStreamRecorder.start(200);*/

      // Enable view records button
      if (publicVideosCheckbox.checked) {
        btnViewRecords.disabled = false;
      } else {
        btnViewRecords.disabled = true;
      }

      // Indicate that recording is in progress
      //recordinginProgress = true;

      // Create websockets now
      createAllsockets();

      msg = "STATUS: Recording Started."
      document.getElementById("app-status").innerHTML = msg;
    }
    catch (err) {
      let msg = "STATUS: Merged stream recording Error."
      document.getElementById("app-status").innerHTML = msg;
      console.error("Merged stream recording Error: " + err.message);
    }
  } else if (recordWebcam == true) {
    // Record webcam if enabled
    try {
      // Show webcam recording has started
      msg = "STATUS: Recording Started."
      document.getElementById("app-status").innerHTML = msg;

      recordStream().then(() => {
        recordingSynched = true;
        streamWebcamToYT = true;
        streamScreenToYT = false;
        streamMergedToYT = false;
        //webcamRecorder.start(200);
        streamWebcamToYT = true;
        // Enable view records button
        if (publicVideosCheckbox.checked) {
          btnViewRecords.disabled = false;
        } else {
          btnViewRecords.disabled = true;
        }
        // Indicate that recording is in progress
        //recordinginProgress = true;

        // Create websockets now
        createAllsockets();
      });
    }
    catch (err) {
      let msg = "STATUS: Webcam recording Error."
      document.getElementById("app-status").innerHTML = msg;
      console.error("Webcam recording Error: " + err.message);
    }
  } else if (recordScreen == true) {
    // Record screen if enabled
    try {
      // Show screen recording has started
      msg = "STATUS: Recording Started."
      document.getElementById("app-status").innerHTML = msg;

      recordScreenAndAudio().then(() => {
        recordingSynched = true;
        streamWebcamToYT = false;
        streamScreenToYT = true;
        streamMergedToYT = false;
        //screenRecorder.start(200);
        // Enable view records button
        if (publicVideosCheckbox.checked) {
          btnViewRecords.disabled = false;
        } else {
          btnViewRecords.disabled = true;
        }
        // Indicate that recording is in progress
        //recordinginProgress = true;

        // Create websockets now
        createAllsockets();
      });
    }
    catch (err) {
      let msg = "STATUS: Screen recording Error."
      document.getElementById("app-status").innerHTML = msg;
      console.error("Screen recording Error: " + err.message);
    }
  }
}


// Pauses webcam and screen recording
async function pauseRecording() {
  try {
    if (webcamRecorder.state === "recording") {
      webcamRecorder.pause();
      // webcam recording paused
    }

    if (screenRecorder.state === "recording") {
      screenRecorder.pause();
      // screen recording paused
    }

    if (mergedStreamRecorder.state === "recording") {
      mergedStreamRecorder.pause();
      // merged recording paused
    }

    let msg = "STATUS: Recording Paused."
    document.getElementById("app-status").innerHTML = msg;
  }
  catch (err) {
    let msg = "STATUS: Pause Recording Error."
    document.getElementById("app-status").innerHTML = msg;
    console.error("Pause Recording Error: " + err.message);
  }
}

// Resumes webcam and screen recording
async function resumeRecording() {
  try {

    if (webcamRecorder.state === "paused") {
      webcamRecorder.resume();
      // resume webcam recording
    }

    if (screenRecorder.state === "paused") {
      screenRecorder.resume();
      // resume screen recording
    }

    if (mergedStreamRecorder.state === "paused") {
      mergedStreamRecorder.resume();
      // resume merged recording
    }

    let msg = "STATUS: Recording Resumed."
    document.getElementById("app-status").innerHTML = msg;
  }
  catch (err) {
    let msg = "STATUS: Resume Recording Error."
    document.getElementById("app-status").innerHTML = msg;
    console.error("Resume Recording Error: " + err.message);
  }
}

// Validates test details
async function validateModal() {
  // Clear previous test data
  usernameValue = null;
  testNameValue = null;
  testDescriptionValue = null;
  testRecordingData = null;

  // Validate username
  let docIsValid = true;
  usernameValue = document.getElementById("username").value;
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
    testNameErrorMsg = "Please replace the space with an underscor for example hi_you";
    testNameIsValid = false;
  }

  document.getElementById("test-name-error").innerHTML = testNameErrorMsg;

  // Get test description
  testDescriptionValue = document.getElementById("test-description").value;

  // All test details are available now
  if ((docIsValid == true) && (testNameIsValid == true)) {
    // Click on close modal button
    document.getElementById("close-modal").click();

    // Disable start recording button
    document.getElementById("start").disabled = true;

    setVideoPrivacyStatus()
    .then(() => {
      startRecording();
    })
    /*.then(() => {
      createAllsockets();
    })*/
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
  // Get csrftoken
  let csrftoken = await getCookie('csrftoken');

  // Send data
  if ((usernameValue != null) && (testRecordingData != null)) {
    setProgressBarValue(50);
    //let fileUploadUrl = 'http://localhost:8000/file/upload/';
    let fileUploadUrl = "https://liveuxstoryboard.com/file/upload/"
    //let fileUploadUrl = '/file/upload/';

    await fetch(fileUploadUrl, {
      method: 'POST',
      headers: { 'X-CSRFToken': csrftoken },
      body: testRecordingData
    })
      .then(response => {
        console.log(response)
        if (response.status == 201) {
          console.log(response.status)
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

          // Hide upload in progress modal
          const btnCloseUploadigModal = document.getElementById('btnCloseUploadigModal');
          btnCloseUploadigModal.click();

          // Show upload complete modal
          let uploadCompleteModal = new bootstrap.Modal(document.getElementById('uploadComplete'));
          uploadCompleteModal.show();

          // Return json data
          return response.json();

        } else {
          console.log(response.status)
          msg = "STATUS: Files Upload Failed."
          document.getElementById("app-status").innerHTML = msg;

          // Hide upload in progress modal
          const btnCloseUploadigModal = document.getElementById('btnCloseUploadigModal');
          btnCloseUploadigModal.click();

          // Show upload failed modal
          let uploadFailedModal = new bootstrap.Modal(document.getElementById('uploadFailed'));
          uploadFailedModal.show();
        }
      })
      .then((json) => {
        try {
          let newFileLinks = json;
          console.log("newFileLinks: ", newFileLinks)
          //Set current video file links on vps
          set_video_links(newFileLinks)
        } catch (error) {
          console.error("Error while setting video links: ", error)
        }
      })
      .catch(error => {
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
    //console.log("fileRandomString: ", fileRandomString);

    // Try to Send test data again
    stopRecording();
  })
}

// Gets the key log file
async function uploadSeleniumIdeFile() {
  // Close modal if showing
  const btnCloseKeyLofFileUploadModal2 = document.getElementById('closeFileModal2');
  btnCloseKeyLofFileUploadModal2.click();
  // Show the get key log file modal
  let keyLogFileUploadModal = new bootstrap.Modal(document.getElementById('keyLogFileUploadModal'));
  keyLogFileUploadModal.show();

  // Selenium ide file input
  const input = document.getElementById('inpt-test-file');
  const currentKeyLogFile = input.files[0];

  // Beanote/Clickup file upload
  const input2 = document.getElementById('inpt-beanote-file');
  const currentBeanoteFile = input2.files[0];

  // Append beanote/Clickup file first
  // Close modal
  if (currentBeanoteFile != null) {
    input2.value = "";

    // Initialize the data object if null
    if (testRecordingData == null) {
      testRecordingData = new FormData();
    }

    // Append file
    //let newBeanoteFileName = fileRandomString + "_" + currentBeanoteFile.name;
    //testRecordingData.set('beanote_file', currentBeanoteFile, newBeanoteFileName);
    //let newBeanoteFileName = filesTimestamp + "_" + currentBeanoteFile.name;
    let newBeanoteFileName = testNameValue + "_" + filesTimestamp + "_" + currentBeanoteFile.name;
    testRecordingData.set('beanote_file', currentBeanoteFile, newBeanoteFileName);
    console.log("newBeanoteFileName: ", newBeanoteFileName);
  }


  // Close modal
  if (currentKeyLogFile != null) {
    input.value = "";

    // Initialize the data object if null
    if (testRecordingData == null) {
      testRecordingData = new FormData();
    }

    // Append key log file
    //let newFileName = fileRandomString + "_" + currentKeyLogFile.name;
    //testRecordingData.set('key_log_file', currentKeyLogFile, newFileName);
    let newFileName = testNameValue + "_" + filesTimestamp + "_" + currentKeyLogFile.name;
    testRecordingData.set('key_log_file', currentKeyLogFile, newFileName);
    console.log("newFileName: ", newFileName);

  }

  if ((currentKeyLogFile != null) || (currentBeanoteFile != null)) {
    // Hide the get key log file modal and proceed to stop test
    const btnCloseKeyLofFileUploadModal = document.getElementById('btnCloseKeyLogFileUploadModal');
    btnCloseKeyLofFileUploadModal.click();
  }
}

// A function to check if we need to get the key log file
async function keyLogFileCheck() {
  try {

    // Try to stop network timer
    try {
      clearInterval(networkTimer);
    } catch (error) {
      console.error("Error while stopping network timer!");
    }

    // Synchronized recording stop
    recordingSynched = false;
    let logKeyboard = keyLogCheckbox.checked;
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
      } catch (error) {
        console.error("Error while stopping screen recorder: " + err.message);
      }
    }

    // Stop screen and webcam merged stream
    if ((recordScreen == true) && (recordWebcam == true)) {
      try {
        mergedStreamRecorder.stream.getTracks().forEach(track => track.stop());
      } catch (error) {
        console.error("Error while stopping merged stream recorder: " + err.message);
      }
    }

    // let logKeyboard = keyLogCheckbox.checked;

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
    console.log("Checking For Key Log File error: " + err.message);
  }
}

// Opens the selenium IDE window
async function openSeleniumIDEExtensionPage() {
  url = "https://chrome.google.com/webstore/detail/selenium-ide/mooikfkahbdckldjjndioackbalphokd?authuser=1&gclid=CjwKCAiA_omPBhBBEiwAcg7smRFkTf9gIMuqU8EpOoGhMahx1N6boXa65-NkPtbqXIW9R8L7EKgIJxoCdx4QAvD_BwE";
  window.open(url, '_blank').focus();

  // A way to remember not to show the modal again
  storeSeleniumIDEInstallModalSettings();
}

// stores the install selenium ide modal settings
async function storeSeleniumIDEInstallModalSettings() {
  // A way to remember not to show the modal again
  let dontShowAgainCheckbox = document.getElementById("dontShowModalAgain");
  let dontShowAgain = dontShowAgainCheckbox.checked;
  localStorage.setItem("dontShowSelIDEInstallAgain", dontShowAgain.toString());
}

// A function to start the selenium ide extension
async function startSeleniumIDEExtension() {
  try {
    console.log("Starting Selenium IDE Extension");
    url = "chrome-extension://mooikfkahbdckldjjndioackbalphokd/index.html";
    let seleniumIDEWindow = window.open(url, '_blank').focus();
    //seleniumIDEWindow.location.reload();
    //setTimeout(()=>{seleniumIDEWindow.location.reload();}, 5000);
  }
  catch (err) {
    let msg = "STATUS: Error while starting selenium IDE Extension."
    document.getElementById("app-status").innerHTML = msg;
    console.error("Error while starting selenium IDE Extension: " + err.message);
  }
}

// A function to clear global variables on error
async function resetStateOnError() {
  console.error("Reseting state due to error");
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
    video: true, audio: true
  };
  screenAudioConstraints = {
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      sampleRate: 44100
    },
    video: false
  };
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
      // Does this cookie string begin with the name we want?
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
  //console.log("modalstate", modalstate);

  if (modalstate != true) {
    let uploadFailedModal = document.getElementById('uploadFailed');
    uploadFailedModal.classList.add('show');
    //console.log("modal shown");
  }
}

async function view_video_records() {
  alert("Hello from view")
}

async function set_video_links(linksData) {
  //console.log("linksData", linksData)
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
  /*let wsStart = 'ws://'

  if (window.location.protocol == 'https:') {
    wsStart = 'wss://'
  } else {
    wsStart = 'ws://'
  }
  //let wsStart = 'ws://'
  let endpoint = wsStart + window.location.host + "/ws/app/"*/

  //let endpoint = "wss://immense-sands-53205.herokuapp.com/ws/app/"
  //let endpoint = "ws://206.72.196.211:8000/ws/app/"
  //let endpoint = "ws://206.72.196.211:80/ws/app/"
  let endpoint = "wss://liveuxstoryboard.com/ws/app/"

  appWebsocket = new WebSocket(endpoint)
  console.log(endpoint)

  appWebsocket.onopen = function (evt) {
    console.log(evt)

    // Alert user websocket is open
    let msg = "STATUS: Websocket created."
    document.getElementById("app-status").innerHTML = msg;
    console.log(msg);

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
    console.log("Websocket Closed: ", evt)
    if (evt.code != 1000) {
      // We need to reconnect
      //websocketReconnect = true;
      if (errorStop == false) {
        errorStop = true;
        //alert("Recording stopped due to websocket error!")
      }
    }
  };

  appWebsocket.onerror = function (evt) {
    // We need to reconnect
    //websocketReconnect = true;
    //appWebsocket.close();

    let msg = "STATUS: Websocket creation error."
    document.getElementById("app-status").innerHTML = msg;
    console.error("Websocket creation error: ", evt.message);
    //resetStateOnError();

    // Tell user, stop the recording.
    resetStateOnError();
    showErrorModal();
  };

  appWebsocket.onmessage = function (e) {
    //console.log('message', e)
    let receivedMsg = e.data;
    //console.log("Received data: ", receivedMsg)
    msgRcvdFlag = true;

    if (receivedMsg.includes("RTMP url received: rtmp://")) {
      console.log('RTMP url ACK received');

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
    }else if (recordScreen == true) {
      screenRecorder.start(200);
    }

      // Start recording now
      /*startRecording()
        .catch((err) => {
          console.error("Start recording error: ", err)
          resetStateOnError();
          showErrorModal();
        });*/
    } else {
      //console.error('RTMP url ACK not received');
    }
  };
}

async function createBroadcast() {
  url = "youtube/createbroadcast/api/"
  let broadcast_data = new Object();
  broadcast_data.videoPrivacyStatus = videoPrivacyStatus;
  broadcast_data.testNameValue = testNameValue;
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
        throw new Error("Error when creating broadcast!");
      } else {
        broadcastCreated = true;
        return response.json();
      }
    })
    .then((json) => {
      data = json;
      console.log("data: ", data);
      newStreamId = data.newStreamId;
      newStreamName = data.newStreamName;
      newStreamIngestionAddress = data.newStreamIngestionAddress;
      //newRtmpUrl=data.newRtmpUrl;
      newRtmpUrl = "rtmp://a.rtmp.youtube.com/live2" + "/" + newStreamName;
      newBroadcastID = data.new_broadcast_id;
      console.log("newStreamId:", newStreamId);
      console.log("newStreamName:", newStreamName);
      console.log("newStreamIngestionAddress", newStreamIngestionAddress);
      console.log("newRtmpUrl:", newRtmpUrl);
      console.log("new_broadcast_id:", newBroadcastID);
    })
    .catch((err) => {
      console.error("Broadcast creation error: ", err)
      resetStateOnError();
      showErrorModal();
    });

  if (broadcastCreated == true) {
    // Check if we need to add audio stream
    let recordAudio = audioCheckbox.checked;
    if (recordAudio == true) {
      let msg = "browser_sound," + newRtmpUrl;
      appWebsocket.send(msg)
      console.log("Sent RTMP URL: ", msg)
    } else {
      appWebsocket.send(newRtmpUrl)
      console.log("Sent RTMP URL: ", newRtmpUrl)
    }
  }
}

async function endBroadcast() {
  url = "youtube/transitionbroadcast/api/";
  let broadcast_data = new Object();
  broadcast_data.the_broadcast_id = newBroadcastID;
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
      console.log("data: ", data);
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
  //let youtubeLink = "https://youtu.be/9Kann9lg1O8";
  let youtubeLink = "https://youtu.be/" + newBroadcastID;
  window.open(youtubeLink, '_blank');
  return false;
}

// Shows upload failed modal
async function showErrorModal() {
  let errorModal = new bootstrap.Modal(document.getElementById('errorOccurred'));
  errorModal.show();
}

// Timer to check network status every second
networkTimer = setInterval(() => {
  //connectToWebsocket();
  //createDummyWebsocket();
  checkNetworkStatus();
}, 1000) // each 1 second

// Function to check network status
async function checkNetworkStatus() {
  //console.log("Checking network status:");
  let currentDateTime = new Date();
  //console.log("The current date time is as follows:");
  //console.log(currentDateTime);
  let resultInSeconds = currentDateTime.getTime() / 1000;
  //console.log("The current date time in seconds is as follows:")
  //console.log(resultInSeconds);
  let timeNow = resultInSeconds;

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
      clearInterval(networkTimer);
      stopStreams();
      resetStateOnError();
      //alert("Recording stopped due to network problem");
      let errorModal = new bootstrap.Modal(document.getElementById('networkErrorOccurred'));
      errorModal.show();
    }

  }
}

// sets youtube video privacy status
async function setVideoPrivacyStatus() {
  // Check if we need to make videos public
  let makePublic = publicVideosCheckbox.checked;
  if (makePublic == true) {
    videoPrivacyStatus = "public";
  } else {
    videoPrivacyStatus = "private";
  }
}

// Shows the beanote file upload modal
async function showBeanoteFileUploadModal() {
  // Synchronized recording stop
  recordingSynched = false;
  let logKeyboard = keyLogCheckbox.checked;
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
  // Synchronized recording stop
  recordingSynched = false;
  let logKeyboard = keyLogCheckbox.checked;
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
    console.log("newBeanoteFileName: ", newFileName);

    // Hide the get key log file modal and proceed to stop test
    const btnCloseBeanoteFileModal = document.getElementById('closeBeanoteFileModal');
    btnCloseBeanoteFileModal.click();

    // Check for keylog file
    keyLogFileCheck();
  }
}

async function createWebcamScreenSocket(socketType) {
  /*let wsStart = 'ws://'

  if (window.location.protocol == 'https:') {
    wsStart = 'wss://'
  } else {
    wsStart = 'ws://'
  }
  var endpoint = wsStart + window.location.host + "/ws/webcamscreen/"*/
  //var endpoint = wsStart + window.location.host + window.location.pathname
  //var endpoint = wsStart + window.location.host + "/ws/app/"
  //var endpoint = "wss://immense-sands-53205.herokuapp.com/ws/app/"
  //var endpoint = "ws://206.72.196.211:80/ws/app/" 
  let endpoint = "wss://liveuxstoryboard.com/ws/webcamscreen/"

  var socket = new WebSocket(endpoint)
  if (socketType === "webcam") {
    webcamWebSocket = socket;
  } else {
    screenWebSocket = socket;
  }
  console.log(endpoint)

  socket.onopen = function (e) {
    console.log('open', e)
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
    //console.log('message', e)
    let receivedMsg = e.data;
    //console.log("Received data: ", receivedMsg)
    msgRcvdFlag = true;

    if (receivedMsg.includes("Received Recording File Name")) {
      console.log('Socket received file name');
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
      //console.log(receivedMsg);
      //console.log("Received data: ", receivedMsg)
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
  console.log("New File Timestamp: ", filesTimestamp);
}