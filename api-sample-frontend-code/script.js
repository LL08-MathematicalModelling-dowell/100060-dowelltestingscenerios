// Add a video element with id video in your html file
const video = document.getElementById('video')

// Global websocket variable
let youtubeWebSocket = null;
let screenVideoWebSocket = null;
let webcamVideoWebSocket = null;
let fileUploadWebsocket = null;

// Some global variables
let newBroadcastID = null;
//let usernameValue = null;
let usernameValue = "Walter";  // Get this from user for example with an input field
//let testNameValue = null;
let testNameValue = "API testing1"; // Get this from user for example with an input field
//let testDescriptionValue = null;
let testDescriptionValue = "Testing the api"; // Get this from user for example with an input field
let videoPrivacyStatus = "private";
let filesTimestamp = null;
let youtubeVideoUrl = null;
let screenFileName = null;
let webcamFileName = null;

// Used for determining the type of recording; webcam, screen or both.
// you can get these from user with a checkbox for example
let recordWebcam = true;
let recordScreen = true;

// Used to set the websocket mode
let websocketModes = {
  youtube: "youtube",     // sends video to youtube
  vpsVideo: "vps video",  // Stores video file on vps
  vpsFile: "vps file",    // Stores any type of file on vps
}

// Names of files to be uploaded
let newBeanoteFileName = null;
let newKeyLogFileName = null;

// Streams and media recorders
let vpsScreenStream = null;
let vpsWebcamStream = null;
let mergedStreamRecorder = null;
let recorder = null

// Websocket endpoints
//var websocketEndpoint = "ws://localhost:8000/ws/liveuxapi/"; // localhost
var websocketEndpoint = "wss://liveuxstoryboard.com/ws/liveuxapi/"; // interserver vps


// Gets a webcam stream
async function captureMediaDevices(mediaConstraints = {
  video: {
    width: 1280,
    height: 720
  },
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    sampleRate: 44100
  }
}) {
  const stream = await navigator.mediaDevices.getUserMedia(mediaConstraints)

  video.src = null
  video.srcObject = stream
  video.muted = true

  return stream
}

// Gets screen stream
async function captureScreen(mediaConstraints = {
  video: {
    cursor: 'always',
    resizeMode: 'crop-and-scale'
  }
}) {
  const screenStream = await navigator.mediaDevices.getDisplayMedia(mediaConstraints)

  return screenStream
}

// Records webcam
async function recordStream() {

  const stream = vpsWebcamStream;

  video.src = null
  video.srcObject = stream
  video.muted = true

  recorder = new MediaRecorder(stream, {
    mimeType: 'video/webm;codecs=h264',
    videoBitsPerSecond: 3000000
  });

  recorder.ondataavailable = event => {
    if (event.data.size > 0) {
      webcamVideoWebSocket.send(event.data);
    }
  }

  recorder.onstop = () => {
    console.log("Webcam recorder stopped!");
  }

  recorder.start(200)
}


// Records screen and audio
async function recordScreenAndAudio() {

  const stream = vpsScreenStream;

  video.src = null
  video.srcObject = stream
  video.muted = true

  recorder = new MediaRecorder(stream, {
    mimeType: 'video/webm;codecs=h264',
    videoBitsPerSecond: 3000000
  });

  recorder.ondataavailable = event => {
    if (event.data.size > 0) {
      screenVideoWebSocket.send(event.data);
    }
  }

  recorder.onstop = () => {
    console.log("Screen recorder stopped!")
  }

  recorder.start(200)
}

// Records screen and audio for sending to youtube
async function youtubeRecordScreenAndAudio() {
  const screenStream = await captureScreen();
  const audioStream = await captureMediaDevices({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      sampleRate: 44100
    },
    video: false
  });

  const stream = new MediaStream([...screenStream.getTracks(), ...audioStream.getTracks()])

  video.src = null
  video.srcObject = stream
  video.muted = true

  recorder = new MediaRecorder(stream, {
    mimeType: 'video/webm;codecs=h264',
    videoBitsPerSecond: 3000000
  });

  recorder.ondataavailable = event => {
    if (event.data.size > 0) {
      youtubeWebSocket.send(event.data);
    }
  }

  recorder.onstop = () => {
    console.log("YouTube screen recorder stopped!");
  }

  recorder.start(200)
}

// Records webcam for sending to youtube
async function youtubeRecordWebcam() {
  const stream = await captureMediaDevices()

  video.src = null
  video.srcObject = stream
  video.muted = true

  recorder = new MediaRecorder(stream, {
    mimeType: 'video/webm;codecs=h264',
    videoBitsPerSecond: 3000000
  });

  recorder.ondataavailable = event => {
    if (event.data.size > 0) {
      youtubeWebSocket.send(event.data);
    }
  }

  recorder.onstop = () => {
    console.log("YouTube webcam recorder stopped!");
  }

  recorder.start(200)
}

// Records merged screen and webcam stream for sending to youtube
async function youtubeRecordMergedStream() {
  try {
    var merger = new VideoStreamMerger();

    // Set width and height of merger
    let screenWidth = screen.width;
    let screenHeight = screen.height;
    merger.setOutputSize(screenWidth, screenHeight);

    // Check if we need to add audio stream
    //let recordAudio = audioCheckbox.checked;
    let recordAudio = true;
    let muteState = !recordAudio;
    //console.log("muteState: ",muteState)

    // Add the screen capture. Position it to fill the whole stream (the default)
    merger.addStream(vpsScreenStream, {
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
    merger.addStream(vpsWebcamStream, {
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
      youtubeWebSocket.send(event.data);
    }

    mergedStreamRecorder.onstop = () => {
      console.log("Merged Stream Recording stopped!");
    }

    mergedStreamRecorder.start(200);
  }
  catch (err) {
    console.error("Error while recording merged stream stream: " + err.message);
  }
}

// Requests for a youtube broadcast to be created
async function sendCreateBroadcastMessage() {
  let payload = {
    'message': 'Creating Youtube Broadcast',
    'command': 'CREATE_BROADCAST',
    'websocketMode': "youtube",
    'videoPrivacyStatus': videoPrivacyStatus,
    'testNameValue': testNameValue
  }

  payload = JSON.stringify(payload);
  youtubeWebSocket.send(payload);
}

// Requests that a video be stored on VPS
async function sendStoreVideoOnVPSMessage(videoType) {
  let payload = {
    'message': 'Store the video on VPS',
    'command': 'STORE_VIDEO_ON_VPS',
    'websocketMode': 'vps video',
  }

  //console.log("videoType:", videoType);
  if (videoType == "screen") {
    payload.videoFileName = screenFileName;
    payload = JSON.stringify(payload);
    screenVideoWebSocket.send(payload);
  } else if (videoType == "webcam") {
    payload.videoFileName = webcamFileName;
    payload = JSON.stringify(payload);
    webcamVideoWebSocket.send(payload);
  }
}

// Requests that a file e.g. beanote file be stored on VPS
async function sendStoreVPSFileMessage(fileType) {
  let payload = {
    'message': 'File upload on VPS',
    'command': 'STORE_FILE_ON_VPS',
    'websocketMode': websocketModes.vpsFile
  }

  //console.log("fileType: ",fileType)
  if (fileType === "beanote") {
    payload.FileName = newBeanoteFileName;
  }

  if (fileType === "keylog") {
    payload.FileName = newKeyLogFileName;
  }

  payload = JSON.stringify(payload);
  fileUploadWebsocket.send(payload);
}

// Requests for a broadcast to be ended
async function sendEndBroadcastMessage() {
  // Stop media recorders
  //await stopMediaRecorderTracks();

  let payload = {
    'message': 'Ending the broadcast',
    'command': 'END_BROADCAST',
    'user_name': usernameValue,
    'test_description': testDescriptionValue,
    'test_name': testNameValue,
    'user_files_timestamp': filesTimestamp,
  }

  if (newBeanoteFileName != null) {
    payload.beanote_file = newBeanoteFileName;
  }

  if (newKeyLogFileName != null) {
    payload.key_log_file = newKeyLogFileName;
  }

  if (recordWebcam === true && recordScreen === true) {
    payload.merged_webcam_screen_file = youtubeVideoUrl;
    payload.screen_file = screenFileName;
    payload.webcam_file = webcamFileName;
    payload = JSON.stringify(payload);
    youtubeWebSocket.send(payload);
  } else if (recordScreen === true) {
    payload.screen_file = youtubeVideoUrl;
    payload = JSON.stringify(payload);
    youtubeWebSocket.send(payload);
  } else if (recordWebcam === true) {
    payload.webcam_file = youtubeVideoUrl;
    payload = JSON.stringify(payload);
    youtubeWebSocket.send(payload);
  }
}

// Fetches youtube playlists that belong to the user
async function sendFetchPlaylistsMessage() {
  let payload = {
    'message': 'Fetching Playlists',
    'command': 'FETCH_PLAYLISTS'
  }
  payload = JSON.stringify(payload);
  youtubeWebSocket.send(payload);
}

// Inserts a video into a playlist
async function sendPlaylistsInsertMessage() {
  let payload = {
    'message': 'Inserting a video into a Playlist',
    'command': 'INSERT_VIDEO_IN_PLAYLIST',
    //'videoId': 'Rseh69dVBXI', // use variable for this
    'videoId': newBroadcastID,
    'playlistId': 'PLtuQzcUOuJ4c9z360dROYJnp9X5WnnJ39' // Test playlist 3, use variable for this
  }
  payload = JSON.stringify(payload);
  youtubeWebSocket.send(payload);
}


// Stops the tracks of all streams
async function stopMediaRecorderTracks() {
  try {
    await recorder.stream.getTracks().forEach(track => track.stop());
  } catch (error) {
    console.error(error);
  }

  try {
    await vpsScreenStream.getTracks().forEach(track => track.stop());
  } catch (error) {
    console.error(error);
  }

  try {
    await vpsWebcamStream.getTracks().forEach(track => track.stop());
  } catch (error) {
    console.error(error);
  }

  try {
    await mergedStreamRecorder.stream.getTracks().forEach(track => track.stop());
  } catch (error) {
    console.error(error);
  }
}

// Sets the mode of a websocket
async function setWebsocketMode(websocketMode, videoType) {
  if (websocketMode == "youtube") {
    sendCreateBroadcastMessage();
  } else if (websocketMode == "vps video") {
    sendStoreVideoOnVPSMessage(videoType);
  } else if (websocketMode == "vps file") {
    sendStoreVPSFileMessage(videoType);
  }
}

// Handles errors experienced by the websocket
async function handleWebsocketError(receivedMsg) {
  // following steps are optional, they can be added or removed depending on receivedMsg
  await stopMediaRecorderTracks();
  cleanUp();

  alert(receivedMsg.error_message);

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

// Creates a websocket for sending youtube video data
async function createYoutubeWebsocket() {

  /*let wsStart = 'ws://'

  if (window.location.protocol == 'https:') {
    wsStart = 'wss://'
  } else {
    wsStart = 'ws://'
  }
  var endpoint = wsStart + window.location.host + "/ws/liveuxapi/"*/

  //var endpoint = "ws://localhost:8000/ws/liveuxapi/"
  var endpoint = websocketEndpoint; // global end point
  var socket = new WebSocket(endpoint)

  // Assign new socket to correct global websocket variable
  youtubeWebSocket = socket;

  console.log(endpoint)

  socket.onopen = function (e) {
    console.log('open', e)

    // Set a websocket mode
    setWebsocketMode(websocketModes.youtube);
  }


  socket.onmessage = function (e) {
    //console.log('message', e)
    let receivedMsg = e.data;
    //console.log("Received data: ", receivedMsg)
    msgRcvdFlag = true;
    receivedMsg = JSON.parse(receivedMsg);
    console.log("receivedMsg Object: ", receivedMsg);

    if (receivedMsg.hasOwnProperty('FEED_BACK')) {
      console.log("FEED_BACK: ", receivedMsg.FEED_BACK);

      // Broadcast was created
      if (receivedMsg.FEED_BACK == "Broadcast created") {
        // set broadcast id
        newBroadcastID = receivedMsg.broadcast_data.new_broadcast_id;
        console.log("newBroadcastID: ", newBroadcastID);

        //youtube video
        youtubeVideoUrl = "https://youtu.be/" + newBroadcastID

        if (recordWebcam === true && recordScreen === true) {
          // webcam,screen, youtube websockets needed
          youtubeRecordMergedStream();
        } else if (recordScreen === true) {
          youtubeRecordScreenAndAudio();
        } else if (recordWebcam === true) {
          youtubeRecordWebcam();
        }
      }

      // Recording metadata was saved
      if (receivedMsg.FEED_BACK == "Recording metadata saved") {
        alert(receivedMsg.FEED_BACK);

        //clean up
        cleanUp();
      }

      // Failed to save recording metadata
      if (receivedMsg.FEED_BACK == "Failed to save recording metadata") {
        alert(receivedMsg.FEED_BACK);
        console.error("metadata_save_failure: ", receivedMsg.metadata_save_failure);
      }
    }

    if (receivedMsg.hasOwnProperty('message')) {
      console.log("message: ", receivedMsg.message);
    }

    // Websocket error messages
    if (receivedMsg.hasOwnProperty('error_message')) {
      console.log("error_message: ", receivedMsg.error_message);
      handleWebsocketError(receivedMsg);
    }

    // playlists information
    if (receivedMsg.hasOwnProperty('playlists_data')) {
      console.log("playlists_data: ", receivedMsg.playlists_data);
    }

    // video playlist insert status
    if (receivedMsg.hasOwnProperty('video_playlist_insert_status')) {
      console.log("video_playlist_insert_status: ", receivedMsg.video_playlist_insert_status);
    }
  }

  socket.onerror = function (evt) {
    console.error("Websocket creation error: ", evt);
    throw new Error("Websocket creation error: " + evt);
    // ToDo: Tell user, stop the recording.
  };
}

async function createScreenVpsVideoWebsocket() {

  screenFileName = testNameValue + "_" + filesTimestamp + "_" + "screen" + ".webm";
  console.log("screenFileName: ", screenFileName);

  /*let wsStart = 'ws://'

  if (window.location.protocol == 'https:') {
    wsStart = 'wss://'
  } else {
    wsStart = 'ws://'
  }
  var endpoint = wsStart + window.location.host + "/ws/liveuxapi/"*/

  //var endpoint = "ws://localhost:8000/ws/liveuxapi/"
  var endpoint = websocketEndpoint; // global end point
  var socket = new WebSocket(endpoint)
  //globalSocket = socket;

  // Assign new socket to correct global websocket variable
  screenVideoWebSocket = socket;

  console.log(endpoint)

  socket.onopen = function (e) {
    console.log('open', e)

    // Set a websocket mode
    setWebsocketMode(websocketModes.vpsVideo, "screen");
  }


  socket.onmessage = function (e) {
    //console.log('message', e)
    let receivedMsg = e.data;
    //console.log("Received data: ", receivedMsg)
    msgRcvdFlag = true;
    receivedMsg = JSON.parse(receivedMsg);
    console.log("receivedMsg Object: ", receivedMsg);

    if (receivedMsg.hasOwnProperty('FEED_BACK')) {
      console.log("FEED_BACK: ", receivedMsg.FEED_BACK);

      // VPS Video File Name was set
      if (receivedMsg.FEED_BACK == "Video File Name was set") {
        if (recordScreen == true) {
          recordScreenAndAudio();
        }
      }

      // Recording metadata was saved
      if (receivedMsg.FEED_BACK == "Recording metadata saved") {
        alert(receivedMsg.FEED_BACK);

        //clean up
        cleanUp();
      }

      // Failed to save recording metadata
      if (receivedMsg.FEED_BACK == "Failed to save recording metadata") {
        alert(receivedMsg.FEED_BACK);
        console.error("metadata_save_failure: ", receivedMsg.metadata_save_failure);
      }
    }

    if (receivedMsg.hasOwnProperty('message')) {
      console.log("message: ", receivedMsg.message);
    }

    // Websocket error messages
    if (receivedMsg.hasOwnProperty('error_message')) {
      console.log("error_message: ", receivedMsg.error_message);
      handleWebsocketError(receivedMsg);
    }
  }

  socket.onerror = function (evt) {
    console.error("Websocket creation error: ", evt);
    throw new Error("Websocket creation error: " + evt);
    // ToDo: Tell user, stop the recording.
  };
}


async function createWebcamVpsVideoWebsocket() {
  webcamFileName = testNameValue + "_" + filesTimestamp + "_" + "webcam" + ".webm";
  console.log("webcamFileName: ", webcamFileName);

  /*let wsStart = 'ws://'

  if (window.location.protocol == 'https:') {
    wsStart = 'wss://'
  } else {
    wsStart = 'ws://'
  }
  var endpoint = wsStart + window.location.host + "/ws/liveuxapi/"*/

  //var endpoint = "ws://localhost:8000/ws/liveuxapi/"

  var endpoint = websocketEndpoint; // global end point
  var socket = new WebSocket(endpoint)

  // Assign new socket to correct global websocket variable
  webcamVideoWebSocket = socket;

  console.log(endpoint)

  socket.onopen = function (e) {
    console.log('open', e)

    // Set a websocket mode
    setWebsocketMode(websocketModes.vpsVideo, "webcam");
  }


  socket.onmessage = function (e) {
    //console.log('message', e)
    let receivedMsg = e.data;
    //console.log("Received data: ", receivedMsg)
    msgRcvdFlag = true;
    receivedMsg = JSON.parse(receivedMsg);
    console.log("receivedMsg Object: ", receivedMsg);

    if (receivedMsg.hasOwnProperty('FEED_BACK')) {
      console.log("FEED_BACK: ", receivedMsg.FEED_BACK);

      // VPS Video File Name was set
      if (receivedMsg.FEED_BACK == "Video File Name was set") {
        if (recordWebcam) {
          recordStream();
        }
      }

      // Recording metadata was saved
      if (receivedMsg.FEED_BACK == "Recording metadata saved") {
        alert(receivedMsg.FEED_BACK);

        //clean up
        cleanUp();
      }

      // Failed to save recording metadata
      if (receivedMsg.FEED_BACK == "Failed to save recording metadata") {
        alert(receivedMsg.FEED_BACK);
        console.error("metadata_save_failure: ", receivedMsg.metadata_save_failure);
      }
    }

    if (receivedMsg.hasOwnProperty('message')) {
      console.log("message: ", receivedMsg.message);
    }

    // Websocket error messages
    if (receivedMsg.hasOwnProperty('error_message')) {
      console.log("error_message: ", receivedMsg.error_message);
      handleWebsocketError(receivedMsg);
    }
  }

  socket.onerror = function (evt) {
    console.error("Websocket creation error: ", evt);
    throw new Error("Websocket creation error: " + evt);
    // ToDo: Tell user, stop the recording.
  };
}

// Creates a file upload websocket for beanote and keylog files
async function createFilesUploadWebSocket(filetype) {
  /*let wsStart = 'ws://'

  if (window.location.protocol == 'https:') {
    wsStart = 'wss://'
  } else {
    wsStart = 'ws://'
  }
  var endpoint = wsStart + window.location.host + "/ws/liveuxapi/"*/

  //var endpoint = "ws://localhost:8000/ws/liveuxapi/"
  var endpoint = websocketEndpoint; // global end point
  var socket = new WebSocket(endpoint)

  // Assign new socket to correct global websocket variable
  fileUploadWebsocket = socket;

  console.log(endpoint)

  socket.onopen = function (e) {
    console.log('open', e)

    // Set a websocket mode
    setWebsocketMode(websocketModes.vpsFile, filetype);
  }


  socket.onmessage = function (e) {
    //console.log('message', e)
    let receivedMsg = e.data;
    //console.log("Received data: ", receivedMsg)
    msgRcvdFlag = true;
    receivedMsg = JSON.parse(receivedMsg);
    console.log("receivedMsg Object: ", receivedMsg);

    if (receivedMsg.hasOwnProperty('FEED_BACK')) {
      console.log("FEED_BACK: ", receivedMsg.FEED_BACK);

      // VPS Video File Name was set
      if (receivedMsg.FEED_BACK == "Upload File Name was set") {
        // ToDo: upload file now
        if (filetype == "beanote") {
          sendFile('inpt-beanote-file');
        }

        if (filetype == "keylog") {
          sendFile('inpt-keylog-file');
        }
      }

      // Upload file was saved
      if (receivedMsg.FEED_BACK == "Upload file was saved") {
        //console.log("filetype: ", filetype);
        if (filetype == "beanote") {
          // Upload keylog file next, close current socket instance first
          closeSpecificWebsocket(socket).then(() => {
            uploadKeylogFile();
          });
        }

        if (filetype == "keylog") {
          // Do next thing after all files upload
          closeSpecificWebsocket(socket).then(() => {
            clearAllFileInputs();
          }).then(() => {
            sendEndBroadcastMessage();
          });

          console.log("All files uploaded")
        }
      }

      // Recording metadata was saved
      if (receivedMsg.FEED_BACK == "Recording metadata saved") {
        alert(receivedMsg.FEED_BACK);

        //clean up
        cleanUp();
      }

      // Failed to save recording metadata
      if (receivedMsg.FEED_BACK == "Failed to save recording metadata") {
        alert(receivedMsg.FEED_BACK);
        console.error("metadata_save_failure: ", receivedMsg.metadata_save_failure);
      }
    }

    if (receivedMsg.hasOwnProperty('message')) {
      console.log("message: ", receivedMsg.message);
    }

    // Websocket error messages
    if (receivedMsg.hasOwnProperty('error_message')) {
      console.log("error_message: ", receivedMsg.error_message);
      handleWebsocketError(receivedMsg);
    }
  }

  socket.onerror = function (evt) {
    console.error("Websocket creation error: ", evt);
    throw new Error("Websocket creation error: " + evt);
    // ToDo: Tell user, stop the recording.
  };
}

// Gets the beanot file name
async function getBeanoteFileName() {
  const beanoteFileInput = document.getElementById('inpt-beanote-file');
  const currentBeanoteFile = beanoteFileInput.files[0];

  if (currentBeanoteFile != null) {
    newBeanoteFileName = testNameValue + "_" + filesTimestamp + "_" + currentBeanoteFile.name;
    console.log("newBeanoteFileName: ", newBeanoteFileName);
    return true;
  } else {
    return false;
  }
}

// Gets keylog file name
async function getKeyLogFileName() {
  const keyLogFileInput = document.getElementById('inpt-keylog-file');
  const currentKeyLogFile = keyLogFileInput.files[0];

  if (currentKeyLogFile != null) {
    newKeyLogFileName = testNameValue + "_" + filesTimestamp + "_" + currentKeyLogFile.name;
    console.log("newKeyLogFileName: ", newKeyLogFileName);
    return true;
  } else {
    return false;
  }
}

// Sends a beanote or keylog file data to backend
async function sendFile(fileInputElement) {

  var file = document.getElementById(fileInputElement).files[0];

  var reader = new FileReader();

  var rawData = new ArrayBuffer();

  reader.loadend = function () {

  }

  reader.onload = function (e) {

    rawData = e.target.result;

    fileUploadWebsocket.send(rawData);

    //alert("the File has been transferred.")
    console.log("The File has been transferred.")

  }

  reader.readAsArrayBuffer(file);

}

// Starts beanote file upload process
async function uploadBeanoteFile() {
  let isBeanoteFileAvailable = await getBeanoteFileName();
  //console.log("isBeanoteFileAvailable: ", isBeanoteFileAvailable)

  if (isBeanoteFileAvailable === true) {
    createFilesUploadWebSocket("beanote");
  } else {
    console.log("No beanote file to upload");
    // Try to upload keylog file
    uploadKeylogFile();
  }
}

// Starts keylog file upload process
async function uploadKeylogFile() {

  let isKeylogFileAvailable = await getKeyLogFileName();;
  //console.log("isKeylogFileAvailable: ", isKeylogFileAvailable)

  if (isKeylogFileAvailable === true) {
    createFilesUploadWebSocket("keylog");
  } else {
    // Save recording metadata now
    console.log("No keylog file to upload");
    sendEndBroadcastMessage();
  }
}

// Closes a specific websocket
async function closeSpecificWebsocket(socketName) {
  try {
    socketName.close();
  } catch (error) {
    console.error("Failed to close websocket: ", socketName)
  }
}

// clears all file input elements
async function clearAllFileInputs() {
  const keyLogFileInput = document.getElementById('inpt-keylog-file');
  const beanoteFileInput = document.getElementById('inpt-beanote-file');
  keyLogFileInput.value = "";
  beanoteFileInput.value = "";
}

// Ends a recording session
async function endRecordingSession() {
  // Stop media recorders
  await stopMediaRecorderTracks();
  uploadBeanoteFile();
}

// cleans up after a recording
async function cleanUp() {
  // video element
  video.src = null;
  video.srcObject = null;
  video.muted = true;

  // close globals sockets
  try {
    youtubeWebSocket.close();
  } catch (error) {
    youtubeWebSocket = null;
  }

  try {
    screenVideoWebSocket.close();
  } catch (error) {
    screenVideoWebSocket = null;
  }

  try {
    webcamVideoWebSocket.close();
  } catch (error) {
    webcamVideoWebSocket = null;
  }

  try {
    fileUploadWebsocket.close();
  } catch (error) {
    fileUploadWebsocket = null;
  }

  // clear global variables
  newBroadcastID = null;
  usernameValue = null;
  testNameValue = null;
  testDescriptionValue = null;
  videoPrivacyStatus = "private";
  filesTimestamp = null;
  youtubeVideoUrl = null;
  screenFileName = null;
  webcamFileName = null;

  recordWebcam = false;
  recordScreen = false;

  newBeanoteFileName = null;
  newKeyLogFileName = null;

  // clear all file input elements
  clearAllFileInputs();
}


/* starts the recording based on user options,
   Options are set using the global variables:
   recordWebcam,
   recordScreen
*/
async function startRecording() {
  await createRecordingTimestamp();

  if (recordWebcam === true && recordScreen === true) {
    // Get user permission to access webcam and mic first
    vpsWebcamStream = await captureMediaDevices()

    const screenStream = await captureScreen()
    const audioStream = await captureMediaDevices({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        sampleRate: 44100
      },
      video: false
    })

    vpsScreenStream = new MediaStream([...screenStream.getTracks(), ...audioStream.getTracks()])

    // webcam,screen, youtube websockets needed
    await createWebcamVpsVideoWebsocket();
    await createScreenVpsVideoWebsocket();
    createYoutubeWebsocket();
  } else if (recordScreen === true) {
    //youtube websocket needed only
    createYoutubeWebsocket();
  } else if (recordWebcam === true) {
    //youtube websocket needed only
    createYoutubeWebsocket();
  }
}

// Gets permission to use the websocket API
async function getWebsocketPermission() {
  //let websocketPermissionURL = 'http://localhost:8000/websocketpermission/';
  let websocketPermissionURL = 'https://100034.pythonanywhere.com/websocketpermission/';
  let responseStatus = null;

  await fetch(websocketPermissionURL, {
    method: 'POST',
    body: JSON.stringify({
      app_id: "ggLD5U02loc"
    }),
    headers: {
      "Content-type": "application/json; charset=UTF-8"
    }
  })
    .then(response => {
      console.log(response)
      responseStatus = response.status;
      console.log("Get websocket permission Response Status", responseStatus);
      // Return json data
      return response.json();
    })
    .then((json) => {
      if (responseStatus == 200) {
        msg = "Websocket Permission was granted"
        console.log(msg);
        console.log("websocket permission Data: ",json);
        console.log("permission_is_granted: ",json.permission_is_granted);
        console.log("token: ",json.token);


        // Proceed to start recording
        startRecording();

      } else {
        // Server error message
        console.log("Server Error Message: ", json)
        msg = "Failed to get websocket permission."

        // Show error modal
        alert(msg);
      }
    })
    .catch(error => {
      console.error(error);
      msg = "Failed to get websocket permission."

      // Show error modal
      alert(msg);
    });
}