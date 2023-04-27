let localCamStream,
  localScreenStream,
  localOverlayStream,
  rafId,
  cam,
  screen,
  mediaRecorder,
  audioContext,
  audioDestination;
let mediaWrapperDiv = document.getElementById("mediaWrapper");
let startWebcamBtn = document.getElementById("startWebcam");
let startScreenShareBtn = document.getElementById("startScreenShare");
let mergeStreamsBtn = document.getElementById("mergeStreams");
let startRecordingBtn = document.getElementById("startRecording");
let stopRecordingBtn = document.getElementById("stopRecording");
let stopAllStreamsBtn = document.getElementById("stopAllStreams");
let canvasElement = document.createElement("canvas");
let canvasCtx = canvasElement.getContext("2d");
let encoderOptions = { mimeType: "video/webm; codecs=vp9" };
let recordedChunks = [];
let audioTracks = [];

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

async function startWebcamFn() {
  localCamStream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: { deviceId: { ideal: "communications" } }
  });
  if (localCamStream) {
    cam = await attachToDOM("justWebcam", localCamStream);
  }
}

async function startScreenShareFn() {
  localScreenStream = await navigator.mediaDevices.getDisplayMedia({
    video: true,
    audio: true
  });
  if (localScreenStream) {
    screen = await attachToDOM("justScreenShare", localScreenStream);
  }
}

async function stopAllStreamsFn() {
  [
    ...(localCamStream ? localCamStream.getTracks() : []),
    ...(localScreenStream ? localScreenStream.getTracks() : []),
    ...(localOverlayStream ? localOverlayStream.getTracks() : [])
  ].map((track) => track.stop());
  localCamStream = null;
  localScreenStream = null;
  localOverlayStream = null;
  cancelVideoFrame(rafId);
  mediaWrapperDiv.innerHTML = "";
  document.getElementById("recordingState").innerHTML = "";
}

async function makeComposite() {
  if (cam && screen) {
    canvasCtx.save();
    canvasElement.setAttribute("width", `${screen.videoWidth}px`);
    canvasElement.setAttribute("height", `${screen.videoHeight}px`);
    canvasCtx.clearRect(0, 0, screen.videoWidth, screen.videoHeight);
    canvasCtx.drawImage(screen, 0, 0, screen.videoWidth, screen.videoHeight);
    canvasCtx.drawImage(
      cam,
      0,
      Math.floor(screen.videoHeight - screen.videoHeight / 4),
      Math.floor(screen.videoWidth / 4),
      Math.floor(screen.videoHeight / 4)
    ); // this is just a rough calculation to offset the webcam stream to bottom left
    let imageData = canvasCtx.getImageData(
      0,
      0,
      screen.videoWidth,
      screen.videoHeight
    ); // this makes it work
    canvasCtx.putImageData(imageData, 0, 0); // properly on safari/webkit browsers too
    canvasCtx.restore();
    rafId = requestVideoFrame(makeComposite);
  }
}

async function mergeStreamsFn() {
  document.getElementById("mutingStreams").style.display = "block";
  await makeComposite();
  audioContext = new AudioContext();
  audioDestination = audioContext.createMediaStreamDestination();
  let fullVideoStream = canvasElement.captureStream();
  let existingAudioStreams = [
    ...(localCamStream ? localCamStream.getAudioTracks() : []),
    ...(localScreenStream ? localScreenStream.getAudioTracks() : [])
  ];
  audioTracks.push(
    audioContext.createMediaStreamSource(
      new MediaStream([existingAudioStreams[0]])
    )
  );
  if (existingAudioStreams.length > 1) {
    audioTracks.push(
      audioContext.createMediaStreamSource(
        new MediaStream([existingAudioStreams[1]])
      )
    );
  }
  audioTracks.map((track) => track.connect(audioDestination));
  console.log(audioDestination.stream);
  localOverlayStream = new MediaStream([...fullVideoStream.getVideoTracks()]);
  let fullOverlayStream = new MediaStream([
    ...fullVideoStream.getVideoTracks(),
    ...audioDestination.stream.getTracks()
  ]);
  console.log(localOverlayStream, existingAudioStreams);
  if (localOverlayStream) {
    overlay = await attachToDOM("pipOverlayStream", localOverlayStream);
    mediaRecorder = new MediaRecorder(fullOverlayStream, encoderOptions);
    mediaRecorder.ondataavailable = handleDataAvailable;
    overlay.volume = 0;
    cam.volume = 0;
    screen.volume = 0;
    cam.style.display = "none";
    // localCamStream.getAudioTracks().map(track => { track.enabled = false });
    screen.style.display = "none";
    // localScreenStream.getAudioTracks().map(track => { track.enabled = false });
  }
}

async function startRecordingFn() {
  mediaRecorder.start();
  console.log(mediaRecorder.state);
  console.log("recorder started");
  document.getElementById("pipOverlayStream").style.border = "10px solid red";
  document.getElementById(
    "recordingState"
  ).innerHTML = `${mediaRecorder.state}...`;
}

async function attachToDOM(id, stream) {
  let videoElem = document.createElement("video");
  videoElem.id = id;
  videoElem.width = 640;
  videoElem.height = 360;
  videoElem.autoplay = true;
  videoElem.setAttribute("playsinline", true);
  videoElem.srcObject = new MediaStream(stream.getTracks());
  mediaWrapperDiv.appendChild(videoElem);
  return videoElem;
}

function handleDataAvailable(event) {
  console.log("data-available");
  if (event.data.size > 0) {
    recordedChunks.push(event.data);
    console.log(recordedChunks);
    download();
  } else {
  }
}

function download() {
  var blob = new Blob(recordedChunks, {
    type: "video/webm"
  });
  var url = URL.createObjectURL(blob);
  var a = document.createElement("a");
  document.body.appendChild(a);
  a.style = "display: none";
  a.href = url;
  a.download = "result.webm";
  a.click();
  window.URL.revokeObjectURL(url);
}

function stopRecordingFn() {
  mediaRecorder.stop();
  document.getElementById(
    "recordingState"
  ).innerHTML = `${mediaRecorder.state}...`;
}

startWebcamBtn.addEventListener("click", startWebcamFn);
startScreenShareBtn.addEventListener("click", startScreenShareFn);
mergeStreamsBtn.addEventListener("click", mergeStreamsFn);
stopAllStreamsBtn.addEventListener("click", stopAllStreamsFn);
startRecordingBtn.addEventListener("click", startRecordingFn);
stopRecordingBtn.addEventListener("click", stopRecordingFn);
