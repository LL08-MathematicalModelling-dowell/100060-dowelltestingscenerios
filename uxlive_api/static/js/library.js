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
let libraryShareRecords = document.querySelector('.library-share');
let channelSelect = document.getElementById("selectChannel");
let channelSelect_1 = document.getElementById("selectChannel_1");
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
let currentCamera = "user";
let audioConstraints = {
    deviceId: {exact: "default"}
};
let videoConstraints = {
    facingMode: currentCamera
};

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

let currentPlayer = null; // Store the current player instance


// video timer
let videoTimer = document.querySelector(".video-timer")
let switchCamBtn = document.querySelector(".switch-btn")
let hourTime = document.querySelector(".hour-time")
let minuteTime = document.querySelector(".minute-time")
let secondTime = document.querySelector(".second-time")
let timeInterval;
let totalTime = 0;

// });
if (window.location.pathname === '/library/') {
    library_page();
}
if (window.innerWidth < 768) {
    $(".mobile-menu").hide();
    // Toggle the div when a checkbox is clicked
    $("#menu-icon").on("click", function () {
        $(".mobile-menu").css("display", function () {
            return $(this).css("display") === "none" ? "flex" : "none";
        });
    });
}
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

if (window.location.pathname === '/') {
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
}
if (window.location.pathname === '/') {

    // display user
    let userIcon = document.querySelector(".user-icon")
    let userDisplay = document.querySelector(".user-display")

    userIcon.addEventListener("click", function () {
        userDisplay.classList.toggle("show-user-bar")
    })
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

function stopMediaTracks(stream) {
    stream.getTracks().forEach(track => {
        track.stop();
    });
}

// Get audio devices
async function gotDevices(mediaDevices) {
    selectAudio.innerHTML = '';
    selectAudio.appendChild(document.createElement('option'));
    let count = 1;
    mediaDevices.forEach(mediaDevice => {
        if (mediaDevice.kind === 'audioinput') {
            const option = document.createElement('option');
            option.value = mediaDevice.deviceId;
            const label = mediaDevice.label || `Audio ${count++}`;
            const textNode = document.createTextNode(label);
            option.appendChild(textNode);
            selectAudio.appendChild(option);
        }
    });
}

navigator.mediaDevices.enumerateDevices().then(gotDevices);

selectCamerabutton.addEventListener('click', event => {
    if (typeof currentStream !== 'undefined') {
        stopMediaTracks(currentStream);
    }
    const videoConstraints = {};
    if (selectVideo.value === 'environment') {
        videoConstraints.facingMode = 'environment';
    } else if (selectVideo.value === 'user') {
        videoConstraints.facingMode = 'user';
    } else {
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
    } catch (err) {
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
    // audio: true
}) {

    try {
        screenStream = await navigator.mediaDevices.getDisplayMedia(mediaConstraints)
        return screenStream
    } catch (err) {
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

// Records merged screen and webcam stream
async function recordMergedStream() {
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

        // Add the screen capture. Position it to fill the whole stream (the default)
        merger.addStream(screenStream, {
            x: 0, // position of the topleft corner
            y: 0,
            width: merger.width,
            height: merger.height,
            mute: muteState // user preference on sound from the screen (if there is any)
        })

        // Calculate dynamic webcam stream height and width
        let webcamStreamWidth = Math.floor(0.15 * screenWidth);
        let webcamStreamHeight = Math.floor((webcamStreamWidth * screenHeight) / screenWidth);

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
            msg = "STATUS: Merged Stream Recording stopped."
            document.getElementById("app-status").innerHTML = msg;
        }

        //mergedStreamRecorder.start(200);
    } catch (err) {
        let msg = "STATUS: Error while recording merged stream stream."
        document.getElementById("app-status").innerHTML = msg;
        alert("Error while recording merged stream stream.");
        // // console.log("Error while recording merged stream stream: " + err.message);

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

    // Add the clickup task ID
    if (receivedTaskID.length > 0) {
        testRecordingData.set('clickupTaskIDs', receivedTaskID);
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

    // Check if we need to add audio stream
    let recordAudio = await microphoneStatus();

    let stream = null;
    if (recordAudio == true) {
        audioStream = await captureMediaDevices(screenAudioConstraints);
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

            //// // console.log('Tracks to add to stream', tracks);
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
        if (recordinginProgress == true) {
            if ((event.data.size > 0) && (recordingSynched == true) && (streamScreenToYT == true)) {
                appWebsocket.send(event.data);
            } else if ((event.data.size > 0) && (recordingSynched == true) && (streamScreenToYT == false)) {
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

// Muhammad Ahmed
// specific function for simultaneously share Cameras and  device screen
async function camAndScreenShare() {

    try {
        screenStream = await navigator.mediaDevices.getDisplayMedia({video: true, audio: false});
        // set up the screen capture stream

        // set up the camera stream
        let webcamStreamWidth = 0;
        let webcamStreamHeight = 0;
        const screenWidth = screen.width;
        const screenHeight = screen.height;

        if (cameraCheckbox.checked) {
            webcamStreamWidth = Math.floor(0.15 * screenWidth);
            webcamStreamHeight = Math.floor((webcamStreamWidth * screenHeight) / screenWidth);

            cameraStream = await navigator.mediaDevices.getUserMedia({video: videoConstraints, audio: false});
        }

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
                cameraStream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        width: webcamStreamWidth,
                        height: webcamStreamHeight
                    }
                });
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
                    const newScreenStream = await navigator.mediaDevices.getDisplayMedia({video: true, audio: false});
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


// Checks recording settings and starts the recording
async function startRecording() {

    // Remove focus from start recording button
    document.getElementById('start').blur();

    // Enable stop recording button
    // document.getElementById("stop").disabled = false;


    // Generate random string for appending to file name
    generateString(6).then((randomString) => {
        fileRandomString = randomString;
        //// // console.log("fileRandomString: ", fileRandomString)
    })

    // Enable or disable audio recording
    try {
        let recordAudio = await microphoneStatus();

        if (recordAudio == true) {
            // Enable audio recording for webcam
            webcamMediaConstraints = {
                video: videoConstraints, audio: audioConstraints
            };
            console.log(videoConstraints);
            console.log(audioConstraints);
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
    } catch (err) {
        let msg = "STATUS: Screen recording Error."
        document.getElementById("app-status").innerHTML = msg;
        console.error("Screen recording Error: " + err.message);
    }

    // show the creating broadcast modal
    showCreatingBroadcastModal(true);

    // Record merged screen and webcam stream
    let recordWebcam = cameraCheckbox.checked;
    let recordScreen = screenCheckbox.checked;
    if ((recordScreen == true) && (recordWebcam == true)) {
        try {

            //old code commited Ahmed
            // await recordStream();
            // console.log("Done with webcam and audio.")
            // await recordScreenAndAudio();
            // console.log("Done with screen and audio.")
            // await recordMergedStream();
            // console.log("Done with merged.")

            // Muhammad Ahmed
            await camAndScreenShare();
            console.log("cam and screen share at a time ")

            // Synchronize recording
            recordingSynched = true;
            streamWebcamToYT = false;
            streamScreenToYT = false;
            streamMergedToYT = true;
            /*screenRecorder.start(200);
            webcamRecorder.start(200);
            mergedStreamRecorder.start(200);*/

            // Create websockets now
            createAllsockets();

            msg = "STATUS: Recording Started."
            document.getElementById("app-status").innerHTML = msg;
        } catch (err) {
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

                // Create websockets now
                createAllsockets();
            });
        } catch (err) {
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

                // Create websockets now
                createAllsockets();
            });
        } catch (err) {
            let msg = "STATUS: Screen recording Error."
            document.getElementById("app-status").innerHTML = msg;
            console.error("Screen recording Error: " + err.message);
        }
    }
}

async function validateAll() {
    let webCam = cameraCheckbox.checked;
    let audio = audioCheckbox.checked;
    if (audio == true) {
        if (selectAudio.value === '') {
            audioConstraints.deviceId = {exact: "default"};
            // currentCameraIsValid = false
        } else {
            audioConstraints.deviceId = {exact: selectAudio.value};
        }
        console.log(audioConstraints);
    }
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
        webcamMediaConstraints = {
            video: videoConstraints, audio: audioConstraints
        };
        document.getElementById("camera-error").innerHTML = cameraErrorMsg;
        validateModal()
    } else {
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
    testNameValue = testNameValue.trim().replace('/\s/', '_');
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

    document.getElementById("test-name-error").innerHTML = testNameErrorMsg;

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
            headers: {'X-CSRFToken': csrftoken},
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

                    //if (errorMessage.includes("Error while handling Clickup Task")) {
                    if (errorMessage.includes("Failed to get")) {
                        // Get task id that has error
                        const faultyTaskIDArray = errorMessage.split(";");
                        faultyTaskID = faultyTaskIDArray[1];
                        faultyTaskID = faultyTaskID.trim();
                        // // console.log("faultyTaskIDArray: ", faultyTaskIDArray)
                        // // console.log("faultyTaskID: ", faultyTaskID)

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
        //// // console.log("fileRandomString: ", fileRandomString);

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
        // // console.log("newBeanoteFileName: ", newBeanoteFileName);
    }


    // Close modal
    if (currentKeyLogFile != null) {
        input.value = "";

        // Initialize the data object if null
        if (testRecordingData == null) {
            testRecordingData = new FormData();
        }

        // Append key log file
        let newFileName = testNameValue + "_" + filesTimestamp + "_" + currentKeyLogFile.name;
        testRecordingData.set('key_log_file', currentKeyLogFile, newFileName);
        // console.log("newFileName: ", newFileName);

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
    } catch (err) {
        let msg = "STATUS: Checking For Key Log File error."
        document.getElementById("app-status").innerHTML = msg;
        // // console.log("Checking For Key Log File error: " + err.message);
    }
}


// A function to clear global variables on error
async function resetStateOnError() {
    console.error("Reseting state due to error");
    let recordWebcam = cameraCheckbox.checked;
    let recordScreen = screenCheckbox.checked;

    // Update application status
    let msg = "STATUS: Recording stopped due to error."
    document.getElementById("app-status").innerHTML = msg;

    // Stop video display tracks
    stopVideoElemTracks(video);

    // resetonStart()
    // Stop the webcam stream
    if (recordWebcam == true) {
        try {
            if (webcamRecorder && webcamRecorder.state === 'recording') {
                webcamRecorder.stop();
            }
            webcamRecorder.stream.getTracks().forEach(track => track.stop());
        } catch (err) {
            console.error("Error while stopping webcam recorder: " + err.message);
        }
    }

    // Stop screen stream
    if (recordScreen == true) {
        try {
            if (screenRecorder && screenRecorder.state === 'recording') {
                screenRecorder.stop();
            }
            screenRecorder.stream.getTracks().forEach(track => track.stop());
        } catch (err) {
            console.error("Error while stopping screen recorder: " + err.message);
        }
    }

    // Stop screen and webcam merged stream
    if ((recordScreen == true) && (recordWebcam == true)) {
        try {
            if (mergedStreamRecorder && mergedStreamRecorder.state === 'recording') {
                mergedStreamRecorder.stop();
            }
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

    if (modalstate != true) {
        let uploadFailedModal = document.getElementById('uploadFailed');
        uploadFailedModal.classList.add('show');
    }
}

async function set_video_links(linksData) {
    //// // console.log("linksData", linksData)
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
    let wsStart = window.location.protocol == 'https:'
        ? 'wss://'
        : 'ws://';

    let endpoint = wsStart + window.location.host + "/ws/app/"

    appWebsocket = new WebSocket(endpoint)

    appWebsocket.onopen = function (evt) {
        // Alert user websocket is open
        let msg = "STATUS: Websocket created."
        document.getElementById("app-status").innerHTML = msg;

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
        if (evt.code != 1000) {
            if (errorStop == false) {
                errorStop = true;
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
        let receivedMsg = e.data;
        msgRcvdFlag = true;

        if (receivedMsg.includes("RTMP url received: rtmp://")) {
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
                newStreamId = data.newStreamId;
                newStreamName = data.newStreamName;
                newStreamIngestionAddress = data.newStreamIngestionAddress;
                newRtmpUrl = "rtmp://a.rtmp.youtube.com/live2" + "/" + newStreamName;
                newBroadcastID = data.new_broadcast_id;
            } catch {
                resetStateOnError();
                return
            }
        })
        .catch((err) => {
            console.error("Broadcast creation error: ", err)
            resetStateOnError();
        });

    if (broadcastCreated == true) {
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
    const myHeaders = new Headers();
    myHeaders.append('Accept', 'application/json');
    myHeaders.append('Content-type', 'application/json');
    myHeaders.append('X-CSRFToken', csrftoken);

    fetch(url, {method: 'post', body: json_broadcast_data, headers: myHeaders})
        .then((response) => {
            if (response.status != 200) {
                throw new Error("Error when transitioning broadcast!");
            } else {
                return response.json();
            }
        })
        .then((json) => {
            data = json;
            // // console.log("data: ", data);
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
            appWebsocket.close(1000, "User stopped recording");
            ;
        } catch (error) {
            console.error("Error while closing appWebsocket");
        }
        try {
            webcamWebSocket.close(1000, "User stopped recording");
            ;
        } catch (error) {
            console.error("Error while closing webcamWebSocket");
        }
        try {
            screenWebSocket.close(1000, "User stopped recording");
            ;
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

    if (msgRcvdFlag == true) {
        lastMsgRcvTime = timeNow;
        msgRcvdFlag = false;
    } else {
        if (recordinginProgress == false) {
            lastMsgRcvTime = timeNow;
        } else if ((timeNow - lastMsgRcvTime) > 25) { // More than 25 secs
            msgRcvdFlag = false;
            lastMsgRcvTime = timeNow;
            
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
    let unlistedVideo = unlistedVideosCheckbox.checked;
    if (makePublic == true) {
        videoPrivacyStatus = "public";
    } else if (privateVideo == true) {
        videoPrivacyStatus = "private";
    } else if (unlistedVideo == true) {
        videoPrivacyStatus = "unlisted";
    } else {
        videoPrivacyStatus = "unlisted";
    }
}

// Shows the beanote file upload modal
async function showBeanoteFileUploadModal() {
    // Synchronized recording stop
    recordingSynched = false;
    //let logKeyboard = keyLogCheckbox.checked;
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
    // Synchronized recording stop
    recordingSynched = false;
    //let logKeyboard = keyLogCheckbox.checked;
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
        : 'ws://'

    var endpoint = wsStart + window.location.host + "/ws/webcamscreen/"

    var socket = new WebSocket(endpoint)
    if (socketType === "webcam") {
        webcamWebSocket = socket;
    } else {
        screenWebSocket = socket;
    }
    // // console.log(endpoint)

    socket.onopen = function (e) {
        // // console.log('open', e)
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
        //// // console.log('message', e)
        let receivedMsg = e.data;
        //// // console.log("Received data: ", receivedMsg)
        msgRcvdFlag = true;

        if (receivedMsg.includes("Received Recording File Name")) {
            // // console.log('Socket received file name');
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
            //// // console.log(receivedMsg);
            //// // console.log("Received data: ", receivedMsg)
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
}


// Creates task id websocket
async function createTaskidWebsocket() {
    number_one = document.getElementById('main')
    let wsStart = 'ws://'

    if (window.location.protocol == 'https:') {
        wsStart = 'wss://'
    } else {
        wsStart = 'ws://'
    }
    var endpoint = wsStart + window.location.host + "/ws/taskid/"

    var socket = new WebSocket(endpoint)
    taskIdWebSocket = socket;
    // // console.log(endpoint)

    socket.onopen = function (e) {
        // // console.log('Task ID websocket open', e)
    }


    socket.onmessage = function (e) {
        let receivedMsg = e.data;
        let task_json_infor = JSON.parse(receivedMsg);

        if ("message" in task_json_infor.payload) {
            let storedUserEmail = localStorage.getItem("userClickupEmail");
            let receivedUserEmail = task_json_infor.payload.message.history_items[0].user.email;

            // Make sure task id is for current user
            if (storedUserEmail === receivedUserEmail) {
                receivedTaskID.push(task_json_infor.payload.message.task_id);
                taskIDwasRreceived = true;
                alert("Received Task ID: " + receivedTaskID);
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
    setTimeout(createTaskidWebsocket(), 5000);
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

    // Get playlist description
    // let newPlaylistDescription = document.getElementById("playlist_description_modal").value;

    // Get playlist privacy status
    // let newPlaylistPrivacyStatus = document.getElementById("playlist_privacy_status_modal").value;
    let newPlaylistPrivacyStatus = document.querySelector('input[name="privacy_status"]:checked').value;
    // if (newPlaylistPrivacyStatus === true) {
    //   newPlaylistPrivacyStatus = "public"
    // } else {
    //   newPlaylistPrivacyStatus = "private"
    // }


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

    /*// close modal if open
    const btnCloseNetworkErrorOccurredModal = document.getElementById('close-network-error-occurred-modal');
    btnCloseNetworkErrorOccurredModal.click();
    // Show modal
    const networkErrorOccurredModal = new bootstrap.Modal(document.getElementById('networkErrorOccurred'));
    networkErrorOccurredModal.show();*/
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

// let channel_id = document.querySelector('input[name=channel_id');
// channel_id.addEventListener('keyup', () => {
//     document.getElementById('id-error').innerText = '';
// })
// // Confiqure error display
// let channel_title = document.querySelector('input[name=channel_title]');
// channel_title.addEventListener('keyup', () => {
//         document.getElementById('title-error').innerText = '';
//     }
// );

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
                const {channel_id, channel_title, channel_credential} = resp;
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
    // document.querySelector('#webcam-recording').disabled = true;
    // document.querySelector('#screen-recording').disabled = true;
    document.querySelector('#audio-settings').disabled = true;
    document.querySelector('#public-videos').disabled = true;
    document.querySelector('#private-videos').disabled = true;
    document.querySelector('#unlisted-videos').disabled = true;

    // clear navbar forms
    // Enable share records button
    if (publicVideosCheckbox.checked || unlistedVideosCheckbox.checked) {
        btnShareRecords.style.display = "block";
    } else {
        btnShareRecords.style.display = "none";
    }

    // Get name of the youtube video
    let finalvideoTitle = testNameValue.replace(/_/ig, " ");
    document.querySelector(".video-title").innerHTML = `<h2>${finalvideoTitle}</h2>`
}

/* fetch channels for user */
async function fetchUserChannel() {
    let userChannels;
    let channelsApiUrl = '/youtube/channels/api';
    let statusBar = document.getElementById("app-status");
    let status = 'OK';

    await fetch(channelsApiUrl, {
        method: 'GET',
    })
        .then(response => {
            if (response.ok) {
                return response.json();
            } else if (response.status === 401) {
                // Unauthorized response (status code 401)
                throw new Error('Unauthorized');
            } else if (response.status === 404) {
                // Not Found response (status code 404)
                throw new Error('Not Found');
            } else {
                // Other error responses
                throw new Error('Error: ' + response.status);
            }
        })
        .then((data) => {
            msg = "STATUS: User Channel Received."
            statusBar.innerHTML = msg;
            userChannels = data;
            // console.log("channel_list:", userChannels);
            userChannels.map((obj) => {
                let opt = document.createElement("option");
                let opt_1 = document.createElement("option");
                let channel_id = obj.channel_id;
                let channel_title = obj.channel_title;
                opt.value = channel_title;
                opt_1.value = channel_title;
                opt.innerHTML = channel_title;
                opt_1.innerHTML = channel_title;
                channelSelect.append(opt);
                channelSelect_1.append(opt_1);
                channelSelect.value = channel_title;
                channelSelect.name = channel_title;
            })
        })
        .catch(error => {
            console.error(error);
            status = 'Error';
            if (error.message === 'Unauthorized') {
                // Handle unauthorized error
                msg = 'ERROR: Account is not a Google account';
                statusBar.innerHTML = msg;
                channelSelect.value = 'Channel Unavailable';
            } else if (error.message === 'Not Found') {
                // Handle not found error
                msg = 'ERROR: Account does not have channel created';
                statusBar.innerHTML = msg;
                channelSelect.value = 'Channel Unavailable';
            } else {
                // Handle other errors
                msg = 'ERROR: Unable to fetch channel, please contact the admin';
                statusBar.innerHTML = msg;
                channelSelect.value = 'Channel Unavailable';
            }
        });

    return status;
}

if (window.location.pathname === '/') {
    fetchUserChannel().then(status => {
        if (status === 'OK') {
            loadUserPlaylist();
        }
    });
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

    await fetch('/youtube/fetchplaylists/api/', {method: 'GET',})
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
                // console.log("userPlaylists:", userPlaylists);
                for (const key in userPlaylists) {
                    // console.log(`${key}: ${userPlaylists[key]}`);
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

// async function library_page() {
//   const playlistsResponse = await fetch('/youtube/fetchlibraryplaylists/api/', { method: 'GET' });
//     if (playlistsResponse.ok) {
//     const playlistsData = await playlistsResponse.json();
//     console.log('playlistsData 3429:', playlistsData);
//
//     let playlistsDict = playlistsData.user_playlists;
//     const playlistIds = Object.keys(playlistsDict); // Get the playlist IDs
//
//       // Access the channel title
//     const channelTitle = playlistsData.channel_title;
//
//     // Display playlist names in the HTML select tag
//     const playlistContainer = document.getElementById("playlistContainer");
//     playlistContainer.innerHTML = ''; // Clear existing playlists
//
//     for (let playlistId of playlistIds) {
//       let playlist = playlistsDict[playlistId];
//       if (playlist) {
//         const { title, total_videos, thumbnail_url, privacy_status } = playlist;
//
//         // Skip playlists that have no videos
//         if (total_videos === 0) {
//           continue; // Skip this playlist and continue with the next one
//         }
//
//         // Create a div element to represent the playlist
//         const playlistDiv = document.createElement('div');
//         playlistDiv.classList.add('media', 'd-flex', 'justify-content-center', 'align-items-center', 'up-next');
//         playlistDiv.dataset.playlistId = playlistId; // Store the playlistId as a data attribute
//
//         // Create a div for the thumbnail and time
//         const thumbnailDiv = document.createElement('div');
//         thumbnailDiv.classList.add('position-relative');
//
//         // Create an img element for the thumbnail
//         const thumbnailImg = document.createElement('img');
//         thumbnailImg.classList.add('media-figure', 'img-aside', 'position-relative');
//         thumbnailImg.src = thumbnail_url;
//         thumbnailImg.alt = 'Playlist Thumbnail';
//         thumbnailDiv.appendChild(thumbnailImg);
//
//         // Create a label for the video count
//         const videoCountLabel = document.createElement('span');
//         videoCountLabel.textContent = `Videos: ${total_videos}`;
//         videoCountLabel.classList.add('video-count-label');
//         thumbnailDiv.appendChild(videoCountLabel);
//
//         playlistDiv.appendChild(thumbnailDiv);
//
//         // Create a div for the playlist details
//         const playlistDetailsDiv = document.createElement('div');
//         playlistDetailsDiv.classList.add('media-body');
//
//         // Create a heading for the playlist name
//         const playlistNameHeading = document.createElement('h3');
//         playlistNameHeading.textContent = title;
//         console.log('title 3475:', title)
//         playlistDetailsDiv.appendChild(playlistNameHeading);
//
//         // Add the rest of the playlist details here (e.g., playlist creator, views, etc.)
//
//         playlistDiv.appendChild(playlistDetailsDiv);
//
//         // Add event listener for playlist selection
//         playlistDiv.addEventListener('click', async () => {
//           const selectedPlaylistId = playlistDiv.dataset.playlistId;
//           const selectedPlaylist = playlistsData.user_playlists[selectedPlaylistId];
//
//           // Update the playlist name in the HTML block
//           const playlistNameElement = document.getElementById("playlistname");
//           playlistNameElement.textContent = title;
//
//
//           // Call the function to load and display videos for the selected playlist
//           await user_selected_playlist(selectedPlaylistId, privacy_status, channelTitle);
//           await play_first_video(); // Play the first video of the selected playlist
//         });
//
//         // Append the playlist element to the container
//         playlistContainer.appendChild(playlistDiv);
//       }
//     }
//   }
// }

async function library_page() {
    // const playlistsResponse = await fetch('/youtube/fetchlibraryplaylists/api/', {method: 'GET'});
    const playlistsResponse = await fetch('/youtube/fetchlibraryplaylists/api/', {method: 'GET'});
    if (playlistsResponse.ok) {
        const playlistsData = await playlistsResponse.json();
        // console.log('playlistsData 3516:', playlistsData);

        let playlistsDict = playlistsData.playlists;
        const playlistIds = Object.keys(playlistsDict); // Get the playlist IDs
        // console.log('playlistIds:', playlistIds);

        // Access the channel title
        const channelTitle = playlistsData.channel_title;

        // Display playlist names in batches of 5 in the HTML select tag
        const playlistContainer = document.getElementById("playlistContainer");
        const showMoreButton = document.getElementById("showMoreButton");

        const BATCH_SIZE = 5;
        let startIndex = 0;
        let endIndex = Math.min(BATCH_SIZE, playlistIds.length);

        function loadPlaylists(start, end) {
            // console.log('Loading playlists from index', start, 'to', end);
            for (let i = start; i < end; i++) {
                // console.log('Creating playlist element for index', i);
                let playlistId = playlistIds[i];
                let playlist = playlistsDict[playlistId];
                const {playlist_title, total_videos, thumbnail_url, privacy_status, playlist_id} = playlist;

                // Create a div element to represent the playlist
                const playlistDiv = document.createElement('div');
                playlistDiv.classList.add('single-video-item');
                // playlistDiv.classList.add('media', 'd-flex', 'justify-content-center', 'align-items-center', 'up-next');
                playlistDiv.dataset.playlistId = playlist_id; // Store the playlistId as a data attribute
                playlistDiv.dataset.privacyStatus = privacy_status;

                // Create a div for the thumbnail and time
                const thumbnailDiv = document.createElement('div');
                thumbnailDiv.classList.add('video-img');
                // thumbnailDiv.classList.add('position-relative');

                // Create an img element for the thumbnail
                const thumbnailImg = document.createElement('img');
                // thumbnailImg.classList.add('media-figure', 'img-aside', 'position-relative');
                thumbnailImg.src = thumbnail_url;
                thumbnailImg.alt = 'Playlist Thumbnail';
                thumbnailDiv.appendChild(thumbnailImg);

                // Create a label for the video count
                const videoCountLabel = document.createElement('span');
                videoCountLabel.textContent = `${total_videos} Videos`;
                videoCountLabel.classList.add('video-count-label');
                thumbnailDiv.appendChild(videoCountLabel);

                playlistDiv.appendChild(thumbnailDiv);

                // Create a div for the playlist details
                const playlistDetailsDiv = document.createElement('div');
                playlistDetailsDiv.classList.add('media-body');

                // Create a heading for the playlist name
                const playlistNameHeading = document.createElement('h3');
                playlistNameHeading.textContent = playlist_title;
                playlistDetailsDiv.appendChild(playlistNameHeading);

                // Add the rest of the playlist details here (e.g., playlist creator, views, etc.)
                playlistDiv.appendChild(playlistDetailsDiv);

                // Add event listener for playlist selection
                playlistDiv.addEventListener('click', async () => {
                    const selectedPlaylistId = playlistDiv.dataset.playlistId;
                    const privacy_stat = playlistDiv.dataset.privacyStatus; // Retrieve privacy_status

                    // Call the function to load and display videos for the selected playlist
                    await user_selected_playlist(playlist_title, selectedPlaylistId, privacy_stat, channelTitle);
                    await play_first_video(); // Play the first video of the selected playlist
                });

                // Append the playlist element to the container
                playlistContainer.appendChild(playlistDiv);
            }
        }

        // Load and display the first 5 playlists immediately
        loadPlaylists(startIndex, endIndex);

        // Add event listener for the "SHOW MORE" button
        showMoreButton.addEventListener('click', () => {
            startIndex = endIndex;
            endIndex = Math.min(endIndex + BATCH_SIZE, playlistIds.length);
            // console.log('Loading more playlists from index', startIndex, 'to', endIndex);
            loadPlaylists(startIndex, endIndex);

            // Scroll to the bottom of the playlist container after loading more playlists
            playlistContainer.scrollTop = playlistContainer.scrollHeight;

            // Hide the "SHOW MORE" button if there are no more playlists to load
            if (endIndex >= playlistIds.length) {
                showMoreButton.style.display = 'none';
            }
        });
    }
}

// Helper function to convert duration for video
function convertDuration(duration) {

    // Check for 'P0D' duration
    if (duration === 'P0D') {
        return '00:00:00';
    }

    // Extract hours, minutes, and seconds from the duration string
    const timeRegex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
    const [, hours, minutes, seconds] = duration.match(timeRegex);

    // Format the time string
    const formattedHours = hours ? hours.padStart(2, '0') : '00';
    const formattedMinutes = minutes ? minutes.padStart(2, '0') : '00';
    const formattedSeconds = seconds ? seconds.padStart(2, '0') : '00';

    return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
}

async function user_selected_playlist(playlist_title, selectedPlaylistId, privacy_stat, channelTitle) {
    console.log('Function user_selected_playlist called ');

    try {
        const response = await fetch(`/youtube/videos/api/${selectedPlaylistId}/`, {method: 'GET'});

        if (response.ok) {
            const selected_playlistsData = await response.json();
            let playlistsDict = selected_playlistsData.playlist_videos;
            const playlistIds = Object.keys(playlistsDict);

            const videosContainer = document.getElementById('videosContainer');
            videosContainer.innerHTML = ''; // Clear existing videos
            const showMoreButton = document.getElementById("MorevideosButton");

            const channelName = document.getElementById('channelName');
            channelName.textContent = channelTitle;

            const playlisttitle = document.getElementById('playlisttitle');
            playlisttitle.textContent = `Selected Playlist : ${playlist_title}`;

            const BATCH_SIZE = 2;
            let startIndex = 0;
            let endIndex = Math.min(BATCH_SIZE, playlistIds.length);

            function LoadVideos(start, end) {
                console.log('Loading videos from index', start, 'to', end);
                for (let i = start; i < end; i++) {
                    // console.log('Creating video element for index', i);
                    let video_listId = playlistIds[i];
                    let video_detail = playlistsDict[video_listId];
                    const {
                        videoId,
                        privacyStatus,
                        videoTitle,
                        videoThumbnail,
                        duration,
                        videoDescription
                    } = video_detail;

                    const videoDiv = document.createElement('div');
                    videoDiv.classList.add('single-video-item');
                    // videoDiv.classList.add('media', 'd-flex', 'justify-content-center', 'align-items-center', 'up-next');
                    videoDiv.dataset.videoId = videoId; // Store the playlistId as a data attribute
                    videoDiv.dataset.privacyStatus = privacyStatus;

                    // Create a div for the thumbnail and time
                    const thumbnailDiv = document.createElement('div');
                    thumbnailDiv.classList.add('video-img');
                    // thumbnailDiv.classList.add('position-relative');

                    // Create an img element for the thumbnail
                    const thumbnailImg = document.createElement('img');
                    // thumbnailImg.classList.add('media-figure', 'img-aside', 'position-relative');
                    thumbnailImg.src = videoThumbnail;
                    thumbnailImg.alt = 'Video Thumbnail';
                    thumbnailDiv.appendChild(thumbnailImg);

                    // Create a label for the video duration
                    const videoCountLabel = document.createElement('span');
                    videoCountLabel.textContent = `${convertDuration(duration)}`;
                    // videoCountLabel.textContent = `Duration: ${convertDuration(duration)}`;
                    videoCountLabel.classList.add('video-count-label');
                    thumbnailDiv.appendChild(videoCountLabel);

                    videoDiv.appendChild(thumbnailDiv);

                    // Create a div for the video details
                    const videoDetailsDiv = document.createElement('div');
                    videoDetailsDiv.classList.add('media-body');

                    // Create a heading for the video name
                    const videoNameHeading = document.createElement('h3');
                    videoNameHeading.textContent = videoTitle;
                    videoDetailsDiv.appendChild(videoNameHeading);

                    // Add the rest of the Video details here (e.g., playlist creator, views, etc.)
                    videoDiv.appendChild(videoDetailsDiv);

                    // Add event listener for Video selection
                    videoDiv.addEventListener('click', async () => {
                        const selectedvideoId = videoDiv.dataset.videoId;
                        const privacy_stat = videoDiv.dataset.privacyStatus; // Retrieve privacy_status

                        // Call the function to play video
                        await play(video_detail);
                    });

                    // Append the playlist element to the container
                    videosContainer.appendChild(videoDiv);
                }
            }

            LoadVideos(startIndex, endIndex);
            // Add event listener for the "SHOW MORE" button
            showMoreButton.addEventListener('click', () => {
                startIndex = endIndex;
                endIndex = Math.min(endIndex + BATCH_SIZE, playlistIds.length);
                // console.log('Loading more playlists from index', startIndex, 'to', endIndex);
                LoadVideos(startIndex, endIndex);

                // Scroll to the bottom of the playlist container after loading more playlists
                videosContainer.scrollTop = videosContainer.scrollHeight;

                // Hide the "SHOW MORE" button if there are no more playlists to load
                if (endIndex >= playlistIds.length) {
                    showMoreButton.style.display = 'none';
                }
            });
        } else {
            console.error('Failed to fetch videos for the playlist.');
            }
    } catch (error) {
        console.error('Error fetching or displaying videos:', error);
    }
}


async function play(videoObject) {
    console.log('called Play function')
    // Destroy the existing player
    if (currentPlayer) {
        currentPlayer.destroy();
        currentPlayer = null;
    }

    // Create a new YouTube player with a small delay
    setTimeout(() => {
        console.log('videoObject is 3781:', videoObject);
        currentPlayer = new YT.Player('youtube_player', {
            videoId: videoObject.id,
            events: {
                onReady: function (event) {
                    event.target.playVideo();
                    updateVideoInfo(videoObject);

                    // const likeButton = document.getElementById('thumb_like');
                    // const dislikeButton = document.getElementById('thumb_dislike');

                    // likeButton.addEventListener('click', function () {
                    //     handleVideoRating('like', videoObject.id);
                    // });

                    // dislikeButton.addEventListener('click', function () {
                    //     handleVideoRating('dislike', videoObject.videoId);
                    // });
                },
            },
        });
    }, 50);
}

function updateVideoInfo(videoObject) {
    // playing video update info on html
    console.log('function updateVideoInfo 3796: ', videoObject)
    videoId = videoObject.videoId;
    console.log(videoId);
    const titleElement = document.querySelector('.play-video-title');
    // const titleElement = document.querySelector('.fs-4.fw-bold');
    const thumbnailElement = document.querySelector('.img-profile');
    const privacy = document.getElementById('playingvideo_privacy');

    // Update the elements with video information
    titleElement.textContent = videoObject.videoTitle;
    thumbnailElement.src = videoObject.videoThumbnail;
    privacy.textContent = `Privacy: ${videoObject.privacyStatus}`;
    // titleElement.textContent = videoObject.title;
    // thumbnailElement.src = videoObject.thumbnail;
    // privacy.textContent = `Privacy: ${videoObject.privacy}`;

}


async function handleVideoRating(rating, videoId) {
    console.log('Video rating function call 3803 rating and videoid as a parameter:', rating, videoId)
    try {
        let csrftoken = await getCookie('csrftoken');
        let rateing_url = `/youtube/videos/api/rate/${videoId}/`;

        await fetch(rateing_url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken,
            },
            body: JSON.stringify({rating: rating}),
        });

        if (response.ok) {
            console.log(`Rated ${rating} for video with ID: ${videoId}`);
        } else {
            console.error('Failed to rate the video');
        }
    } catch (error) {
        console.error('An error occurred while rating the video:', error);
    }
}

async function play_first_video() {
    // Get the first video from html block and then pass the required vriables to other function

    const videos = document.getElementById('videosContainer');

    if (videos.children.length > 0) {
        let videoObject = null;

        for (let i = 0; i < videos.children.length; i++) {
            const videoDiv = videos.children[i];
            const videoId = videoDiv.getAttribute('data-video-id');
            const videoTitle = videoDiv.querySelector('h3').textContent;
            const privacy = videoDiv.getAttribute('data-privacy-status');
            const thumbnailImg = videoDiv.querySelector('.media-figure'); // Select the img element
            const thumbnail = thumbnailImg.getAttribute('src'); // Get the src attribute value


            if (videoId && videoTitle) {
                videoObject = {
                    id: videoId,
                    title: videoTitle,
                    thumbnail: thumbnail,
                    privacy:privacy,
                };
                break;
            }
        }

        if (videoObject) {
            await play(videoObject);
        } else {
            console.log('No valid video found in playlist');
        }
    }
}


// Attach event listener to the Autoplay switch
const autoplaySwitch = document.querySelector('.switch-container');
autoplaySwitch.addEventListener('click', function () {
    const autoplayCircle = document.querySelector('.switch-circle');
    const autoplayOn = autoplayCircle.classList.contains('on');

    if (autoplayOn) {
        autoplayCircle.classList.remove('on');
        clearInterval(autoplayInterval);
    } else {
        autoplayCircle.classList.add('on');
        const autoplayInterval = setInterval(play_next_video, 5000);
    }
});

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

async function copySelectedLink() {

    let youtubeLink = "https://youtu.be/" + videoId;
    // Create a temporary input element to copy link
    var tempInput = document.createElement("input");
    tempInput.value = youtubeLink;
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand("copy");
    document.body.removeChild(tempInput);
    alert("Link copied to clipboard");
}

// share youtube link
async function shareVideoToFacebook() {
    let youtubeLink = "https://youtu.be/" + videoId;
    // Get name of the youtube video
    let videoTitle = document.getElementById("test-name").value;
    let finalvideoTitle = videoTitle.replace(/_/ig, " ");
    document.querySelector(".facebook").href = `https://www.facebook.com/sharer/sharer.php?u=${youtubeLink}&t=${finalvideoTitle}`;
}
async function shareVideoToTwitter() {
    let youtubeLink = "https://youtu.be/" + videoId;
    // Get name of the youtube video
    let videoTitle = document.getElementById("test-name").value;
    let finalvideoTitle = videoTitle.replace(/_/ig, " ");
    document.querySelector(".twitter").href = `https://twitter.com/share?text=${finalvideoTitle}&url=${youtubeLink}&hashtags=${finalvideoTitle}`;
}
async function shareVideoToLinkedin() {
    let youtubeLink = "https://youtu.be/" + videoId;
    // Get name of the youtube video
    let videoTitle = document.getElementById("test-name").value;
    document.querySelector(".linkedin").href = `https://www.linkedin.com/sharing/share-offsite?url=${youtubeLink}`;
}
async function shareVideoToEmail() {
    //let youtubeLink = "https://youtu.be/9Kann9lg1O8";
    let youtubeLink = "https://youtu.be/" + videoId;
    // Get name of the youtube video
    let videoTitle = document.getElementById("test-name").value;
    let finalvideoTitle = videoTitle.replace(/_/ig, " ");
    document.querySelector(".envelope").href = `mailto=?subject='Watch My Video'&amp;body=${finalvideoTitle}%20${youtubeLink}`;
}
async function shareVideoToWhatsapp() {
    //let youtubeLink = "https://youtu.be/9Kann9lg1O8";
    let youtubeLink = "https://youtu.be/" + videoId;
    // Get name of the youtube video
    let videoTitle = document.getElementById("test-name").value;
    let finalvideoTitle = videoTitle.replace(/_/ig, " ");
    document.querySelector(".whatsapp").href = `https://api.whatsapp.com/send?text=${finalvideoTitle}%20${youtubeLink}`;
}

// share library video modal
async function shareLibraryLinkModal() {
    // close modal if open
    const btnCloseshareLibraryLinkModal = document.getElementById('close-share-library-link-modal');
    btnCloseshareLibraryLinkModal.click();
    // Show modal
    const libraryLinkModal = new bootstrap.Modal(document.getElementById('share-library-link-modal'));
    libraryLinkModal.show();
}