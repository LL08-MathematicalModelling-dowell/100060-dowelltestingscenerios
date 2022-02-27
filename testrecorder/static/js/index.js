// Some app controls
const video = document.getElementById('video')
const cameraCheckbox = document.getElementById('webcam-recording')
const screenCheckbox = document.getElementById('screen-recording')
const keyLogCheckbox = document.getElementById('key-logging')
const audioCheckbox = document.getElementById('audio-settings')

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
    alert("Error while getting webcam stream.");
  }
}

// Gets screen recording stream
async function captureScreen(mediaConstraints = {
  video: {
    cursor: 'always',
    resizeMode: 'crop-and-scale'
  }
}) {

  try {
    const screenStream = await navigator.mediaDevices.getDisplayMedia(mediaConstraints)

    return screenStream
  }
  catch (err) {
    let msg = "STATUS: Error while getting screen stream."
    document.getElementById("app-status").innerHTML = msg;
    alert("Error while getting screen stream.");
  }
}

// Records webcam and audio
async function recordStream() {
  webCamStream = await captureMediaDevices(webcamMediaConstraints);

  video.src = null
  video.srcObject = webCamStream
  video.muted = true

  webcamRecorder = new MediaRecorder(webCamStream);

  webcamRecorder.ondataavailable = event => {
    if ((event.data.size > 0) && (recordingSynched == true)) {
      webcamChunks.push(event.data)
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

    // Add the screen capture. Position it to fill the whole stream (the default)
    merger.addStream(screenStream, {
      x: 0, // position of the topleft corner
      y: 0,
      width: merger.width,
      height: merger.height,
      mute: true // we don't want sound from the screen (if there is any)
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
    mergedStreamRecorder = new MediaRecorder(mergedStream);

    mergedStreamRecorder.ondataavailable = event => {
      if ((event.data.size > 0) && (recordingSynched == true)) {
        mergedStreamChunks.push(event.data)
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
  // Enable start recording button
  document.getElementById("start").disabled = false;

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

  // Create webcam video file
  if (recordWebcam == true) {


    if (webcamChunks.length != 0) {
      let prog = 0;
      let fileName = testNameValue + "_" + "webcam_" + fileRandomString + ".webm"
      for (let i = 0; i < webcamChunks.length; i++) {
        let fd = new FormData();
        fd.set('video_bytes', webcamChunks[i]);
        fd.set('fileName', fileName);
        url = "/file/upload/bytes/"
        await fetch(url, { method: 'post', body: fd }).then((res) => {
          res.text();
          if (res.status === 201) {
            // Show some progress
            prog = Math.floor((12 / webcamChunks.length) * i);
            setProgressBarValue(globalProgress + prog);
          } else {
            console.log(response.status)
    
            // Hide upload in progress modal
            const btnCloseUploadigModal = document.getElementById('btnCloseUploadigModal');
            btnCloseUploadigModal.click();
    
            // Show upload failed modal
            showUploadFailedModal();

            // Break from loop
            i = i + webcamChunks.length;
          }
        }).catch(error => {
          msg = "STATUS: Files Upload Failed."
          document.getElementById("app-status").innerHTML = msg;
    
          // Hide upload in progress modal
          const btnCloseUploadigModal = document.getElementById('btnCloseUploadigModal');
          btnCloseUploadigModal.click();
    
          // Show upload failed modal
          showUploadFailedModal();

          // Break from loop
          i = i + webcamChunks.length;
        });
      }

      globalProgress = globalProgress + prog;
      testRecordingData.set('webcam_file', fileName);
    }
  }

  // Create screen recording video file
  if (recordScreen == true) {


    if (screenRecorderChunks.length != 0) {
      let prog = 0;
      let fileName = testNameValue + "_" + "screen_" + fileRandomString + ".webm"
      for (let i = 0; i < screenRecorderChunks.length; i++) {
        let fd = new FormData();
        fd.set('video_bytes', screenRecorderChunks[i]);
        fd.set('fileName', fileName);
        url = "/file/upload/bytes/"
        await fetch(url, { method: 'post', body: fd }).then((res) => {
          res.text();
          if (res.status === 201) {
            // Show some progress
            prog = Math.floor((12 / screenRecorderChunks.length) * i);
            setProgressBarValue(globalProgress + prog);
          } else {
            console.log(response.status)
    
            // Hide upload in progress modal
            const btnCloseUploadigModal = document.getElementById('btnCloseUploadigModal');
            btnCloseUploadigModal.click();
    
            // Show upload failed modal
            showUploadFailedModal();

            // Break from loop
            i = i + screenRecorderChunks.length;
          }
        }).catch(error => {
          msg = "STATUS: Files Upload Failed."
          document.getElementById("app-status").innerHTML = msg;
    
          // Hide upload in progress modal
          const btnCloseUploadigModal = document.getElementById('btnCloseUploadigModal');
          btnCloseUploadigModal.click();
    
          // Show upload failed modal
          showUploadFailedModal();

          // Break from loop
          i = i + screenRecorderChunks.length;
        });
      }
      globalProgress = globalProgress + prog;
      testRecordingData.set('screen_file', fileName);
    }
  }

  // Record screen and webcam merged
  if ((recordScreen == true) && (recordWebcam == true)) {
    //mergedStreamRecorder.stop();

    if (mergedStreamChunks.length != 0) {
      let prog = 0;
      let fileName = testNameValue + "_" + "merged_" + fileRandomString + ".webm"
      for (let i = 0; i < mergedStreamChunks.length; i++) {
        let fd = new FormData();
        fd.set('video_bytes', mergedStreamChunks[i]);
        fd.set('fileName', fileName);
        url = "/file/upload/bytes/"
        await fetch(url, { method: 'post', body: fd }).then((res) => {
          res.text();
          if (res.status === 201) {
            // Show some progress
            prog = Math.floor((12 / mergedStreamChunks.length) * i);
            setProgressBarValue(globalProgress + prog);
          } else {
            console.log(response.status)
    
            // Hide upload in progress modal
            const btnCloseUploadigModal = document.getElementById('btnCloseUploadigModal');
            btnCloseUploadigModal.click();
    
            // Show upload failed modal
            showUploadFailedModal();

            // Break from loop
            i = i + mergedStreamChunks.length;
          }
        }).catch(error => {
          msg = "STATUS: Files Upload Failed."
          document.getElementById("app-status").innerHTML = msg;
    
          // Hide upload in progress modal
          const btnCloseUploadigModal = document.getElementById('btnCloseUploadigModal');
          btnCloseUploadigModal.click();
    
          // Show upload failed modal
          showUploadFailedModal();

          // Break from loop
          i = i + mergedStreamChunks.length;
        });
      }

      globalProgress = globalProgress + prog;
      testRecordingData.set('merged_webcam_screen_file', fileName);
    }
  }

  // Append test details data
  testRecordingData.set('user_name', usernameValue);
  testRecordingData.set('test_description', testDescriptionValue);
  testRecordingData.set('test_name', testNameValue);

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
    stream = new MediaStream([...screenStream.getTracks(), ...audioStream.getTracks()]);
  } else {
    stream = new MediaStream([...screenStream.getTracks()]);
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

  screenRecorder = new MediaRecorder(stream)

  screenRecorder.ondataavailable = event => {
    if ((event.data.size > 0) && (recordingSynched == true)) {
      //if (event.data.size > 0) {
      screenRecorderChunks.push(event.data)
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
      await recordScreenAndAudio();
      await recordMergedStream();

      // Synchronize recording
      recordingSynched = true;
      screenRecorder.start(200);
      webcamRecorder.start(200);
      mergedStreamRecorder.start(200);

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

      recordStream().then(()=>{
        recordingSynched = true;
        webcamRecorder.start(200);
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

      recordScreenAndAudio().then(()=>{
        recordingSynched = true;
        screenRecorder.start(200);
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

    // Start the test now
    await startRecording();
  }
}

// Sends recorded test data using axios
async function sendAvailableData(prevProgress) {
  // Get csrftoken
  let csrftoken = await getCookie('csrftoken');

  // Send data
  if ((usernameValue != null) && (testRecordingData != null)) {
    axios.request({
      method: "post",
      url: '/file/upload/',
      headers: { 'X-CSRFToken': csrftoken },
      data: testRecordingData,
      onUploadProgress: (p) => {
        let uploadedPercentage = 0;
        if (p.total > 0) {
          uploadedPercentage = Math.floor((p.loaded * 12) / p.total);
        }
        else {
          uploadedPercentage = 0;
        }

        // Update the progress bar
        setProgressBarValue(uploadedPercentage + prevProgress);
      }
    }).then(response => {
      console.log(response)
      if (response.status == 201) {
        console.log(response.status)
        msg = "STATUS: Files Uploaded."
        document.getElementById("app-status").innerHTML = msg;

        // Set current video file links on mega drive
        set_video_links(response.data)

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
    }).catch(error => {
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

  const input = document.getElementById('inpt-test-file');
  const currentKeyLogFile = input.files[0];

  // Close modal
  if (currentKeyLogFile != null) {
    input.value = "";

    // Initialize the data object if null
    if (testRecordingData == null) {
      testRecordingData = new FormData();
    }

    // Append key log file
    let newFileName = fileRandomString+"_"+currentKeyLogFile.name;
    testRecordingData.set('key_log_file', currentKeyLogFile,newFileName);

    // Hide the get key log file modal and proceed to stop test
    const btnCloseKeyLofFileUploadModal = document.getElementById('btnCloseKeyLogFileUploadModal');
    btnCloseKeyLofFileUploadModal.click();
  }
}

// A function to check if we need to get the key log file
async function keyLogFileCheck() {
  try {

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

  // Enable start recording button
  document.getElementById("start").disabled = false;

  console.error("Reseting state due to error");
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
async function showUploadFailedModal(){
  modalstate = document.getElementById('uploadFailed').classList.contains('show');
  //console.log("modalstate", modalstate);

  if (modalstate != true){
    let uploadFailedModal = document.getElementById('uploadFailed');
    uploadFailedModal.classList.add('show');
    //console.log("modal shown");
  }
}

async function view_video_records(){
  alert("Hellow from view")
}

async function set_video_links(linksData){
  console.log("linksData",linksData)
  let webcamLink = document.getElementById('webcam_link');
  let screenLink = document.getElementById('screen_link');
  let mergedLink = document.getElementById('merged_link');
  webcamLink.value = linksData.webcam_file; 
  screenLink.value = linksData.screen_file;
  mergedLink.value = linksData.merged_webcam_screen_file;
}