var socket = io.connect('http://' + document.domain + ':' + location.port);
var mediaRecorder;
var isStreaming = false;
var mediaStream;
var streamId; // Initialize the streamId variable

socket.on('connect', function () {
    console.log('Connected');
});

socket.on('disconnect', function () {
    console.log('Disconnected');
});

socket.on('stream_started', function () {
    startRecording();
});

socket.on('stream_stopped', function () {
    stopRecording();
});

socket.on('stream_id', function (data) {
    // Store the received stream_id to use when stopping the stream
    streamId = data.stream_id;
});

// function startStreaming() {
//     if (!isStreaming) {
//         // Get the stream key from the user
//         var streamKey = prompt('Enter your stream key:');
//         if (streamKey) {
//             socket.emit('start_stream', streamKey);
//         }
//     }
// }

function startLiveStream() {
    // Make a fetch request to your /startLiveStream endpoint
    fetch('/startLiveStream', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
    })
    .then(response => response.json())
    .then(data => {
        const streamId = data.newStreamName; // Extract stream ID from the response
        if (streamId) {
            console.log(streamId);
            startStreaming(streamId);
            // socket.emit('start_stream', streamId); // Emit the stream ID to start streaming
        } else {
            // console.log('Failed to start the stream.');
        }
    })
    .catch(error => {
        console.error('Error starting live stream:', error);
    });
}

function startStreaming(streamKey) {
    if (!isStreaming) {
        // Get the stream key from the user
        // var streamKey = prompt('Enter your stream key:');
        if (streamKey) {
            socket.emit('start_stream', streamKey);
        }
    }
}

function stopStreaming() {
    if (isStreaming) {
        socket.emit('stop_stream', { stream_id: streamId});
        stopRecording()
    }
}

function startRecording() {
    navigator.mediaDevices.getUserMedia({ audio: true, video: true })
        .then(function (stream) {
            mediaStream = stream;
            video = document.getElementById('video-stream');
            video.srcObject = mediaStream;
            video.play();

            mediaRecorder = new MediaRecorder(stream);
            mediaRecorder.ondataavailable = function (e) {
                if (e.data.size > 0) {
                    socket.emit('stream_data', { stream: e.data, stream_id: streamId });
                }
            };
            mediaRecorder.start(1000);  // Send data every 1 second
            isStreaming = true;
        })
        .catch(function (err) {
            console.log(err.name + ': ' + err.message);
        });
}

function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
        isStreaming = false;
        if (mediaStream) {
            mediaStream.getTracks().forEach(function (track) {
                track.stop();
                track.enabled = false;  // Disable the track
            });
            mediaStream = null;
        }

        if (video) {
            video.pause();
            video.srcObject = null;
            video.load();
        }
    }
}

function printSchedule(){
    const scheduleDateTimeInput = document.getElementById('schedule-date');
    const scheduledTime = new Date(scheduleDateTimeInput.value);

    const currentTime = new Date();
    const timeDifference = scheduledTime - currentTime;

    if (timeDifference <= 0) {
        alert('Please select a future time for scheduling.');
        return;
    } else {
        alert(`Live stream schedule for ${timeDifference}`)
    }
    console.log(scheduleDateTimeInput.value);
    console.log("hello");
    setTimeout(() => {
        startLiveStream();
    }, timeDifference);
}
