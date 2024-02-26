# API Documentation

This document provides details about the endpoints and functionalities of the Flask API.

## Base URL

```
http://localhost:8000/
```

## Authentication

This API uses Google OAuth 2.0 for authentication. Users need to log in with their Google accounts and grant necessary permissions to access the endpoints.

## Endpoints

### 1. `GET /`

**Description**: This endpoint redirects the user to the authorization URL for Google OAuth 2.0 login. If the user is already logged in, it renders the `index.html` template.

### 2. `GET /callback`

**Description**: This endpoint handles the callback URL after successful Google OAuth 2.0 authentication. It retrieves the access token from the authorization response and stores it in the session.

Sure! Here's the updated documentation for the `GET /channel` endpoint, including the example response object:

### 3. `GET /channel`

**Description**: This endpoint retrieves the information of the authenticated user's YouTube channel and returns the channel's snippet information.

**Response Body**: JSON object containing details of the authenticated user's YouTube channel.

Example Response:
```json
{
    "customUrl": "@tryone-tu5gb",
    "description": "",
    "localized": {
        "description": "",
        "title": "Tryone"
    },
    "publishedAt": "2023-05-19T09:22:49.104869Z",
    "thumbnails": {
        "default": {
            "height": 88,
            "url": "https://yt3.ggpht.com/ytc/AOPolaRwN-9kjyKmxcODgoVRtolkdt68I3783rx8cY42xH1xYuPK3jJIhu4Y2-89NS6Q=s88-c-k-c0x00ffffff-no-rj",
            "width": 88
        },
        "high": {
            "height": 800,
            "url": "https://yt3.ggpht.com/ytc/AOPolaRwN-9kjyKmxcODgoVRtolkdt68I3783rx8cY42xH1xYuPK3jJIhu4Y2-89NS6Q=s800-c-k-c0x00ffffff-no-rj",
            "width": 800
        },
        "medium": {
            "height": 240,
            "url": "https://yt3.ggpht.com/ytc/AOPolaRwN-9kjyKmxcODgoVRtolkdt68I3783rx8cY42xH1xYuPK3jJIhu4Y2-89NS6Q=s240-c-k-c0x00ffffff-no-rj",
            "width": 240
        }
    },
    "title": "Tryone"
}
```

**Response Fields**:
- `customUrl` (string): The custom URL of the YouTube channel, if available.
- `description` (string): The description of the YouTube channel.
- `localized` (object): An object containing localized data for the channel, including localized title and description.
    - `description` (string): The localized description of the YouTube channel.
    - `title` (string): The localized title of the YouTube channel.
- `publishedAt` (string): The timestamp when the YouTube channel was published in ISO 8601 format.
- `thumbnails` (object): An object containing URLs for different thumbnail images of the YouTube channel.
    - `default` (object): Default thumbnail image URL and dimensions.
        - `url` (string): The URL of the default thumbnail image.
        - `width` (integer): The width of the default thumbnail image.
        - `height` (integer): The height of the default thumbnail image.
    - `high` (object): High-quality thumbnail image URL and dimensions.
        - `url` (string): The URL of the high-quality thumbnail image.
        - `width` (integer): The width of the high-quality thumbnail image.
        - `height` (integer): The height of the high-quality thumbnail image.
    - `medium` (object): Medium-quality thumbnail image URL and dimensions.
        - `url` (string): The URL of the medium-quality thumbnail image.
        - `width` (integer): The width of the medium-quality thumbnail image.
        - `height` (integer): The height of the medium-quality thumbnail image.
- `title` (string): The title of the YouTube channel.


### 4. `GET /playlists`

**Description**: This endpoint fetches the user's playlists from the YouTube API and returns the playlist details.

**Response Body**: JSON array containing playlist objects, where each object represents a playlist.

Example Response:
```json
[
    {
        "etag": "rLBaS5pCtQFCzNjUsaXNWuPeaPg",
        "id": "PL_CEo5JUlGu2-yRDupi3AAzneE0r6u6Ii",
        "kind": "youtube#playlist",
        "snippet": {
            "channelId": "UCCTQgS1uvsddPJ0mbnt5GGw",
            "channelTitle": "Tryone",
            "description": "descri",
            "localized": {
                "description": "descri",
                "title": "title added"
            },
            "publishedAt": "2023-07-15T15:06:38Z",
            "thumbnails": {
                "default": {
                    "height": 90,
                    "url": "https://i.ytimg.com/img/no_thumbnail.jpg",
                    "width": 120
                },
                "high": {
                    "height": 360,
                    "url": "https://i.ytimg.com/img/no_thumbnail.jpg",
                    "width": 480
                },
                "medium": {
                    "height": 180,
                    "url": "https://i.ytimg.com/img/no_thumbnail.jpg",
                    "width": 320
                }
            },
            "title": "title added"
        }
    },
    // Additional playlist objects...
]
```

**Response Fields**:
- `etag` (string): The ETag of the playlist object.
- `id` (string): The ID of the playlist.
- `kind` (string): The kind of the playlist object (in this case, "youtube#playlist").
- `snippet` (object): An object containing snippet information about the playlist.
    - `channelId` (string): The ID of the YouTube channel that owns the playlist.
    - `channelTitle` (string): The title of the YouTube channel that owns the playlist.
    - `description` (string): The description of the playlist.
    - `localized` (object): An object containing localized data for the playlist, including localized title and description.
        - `description` (string): The localized description of the playlist.
        - `title` (string): The localized title of the playlist.
    - `publishedAt` (string): The timestamp when the playlist was published in ISO 8601 format.
    - `thumbnails` (object): An object containing URLs for different thumbnail images of the playlist.
        - `default` (object): Default thumbnail image URL and dimensions.
            - `url` (string): The URL of the default thumbnail image.
            - `width` (integer): The width of the default thumbnail image.
            - `height` (integer): The height of the default thumbnail image.
        - `high` (object): High-quality thumbnail image URL and dimensions.
            - `url` (string): The URL of the high-quality thumbnail image.
            - `width` (integer): The width of the high-quality thumbnail image.
            - `height` (integer): The height of the high-quality thumbnail image.
        - `medium` (object): Medium-quality thumbnail image URL and dimensions.
            - `url` (string): The URL of the medium-quality thumbnail image.
            - `width` (integer): The width of the medium-quality thumbnail image.
            - `height` (integer): The height of the medium-quality thumbnail image.
        - `maxres` (object): Maximum resolution thumbnail image URL and dimensions (if available).
            - `url` (string): The URL of the maximum resolution thumbnail image.
            - `width` (integer): The width of the maximum resolution thumbnail image.
            - `height` (integer): The height of the maximum resolution thumbnail image.
        - `standard` (object): Standard resolution thumbnail image URL and dimensions (if available).
            - `url` (string): The URL of the standard resolution thumbnail image.
            - `width` (integer): The width of the standard resolution thumbnail image.
            - `height` (integer): The height of the standard resolution thumbnail image.
    - `title` (string): The title of the playlist.


### 5. `POST /createPlaylist`

**Description**: This endpoint creates a new playlist on YouTube using the provided title and description.

**Request Body**: Form data containing the following parameters:

- `title` (string, required): The title of the new playlist.
- `description` (string, optional): The description of the new playlist.

**Response Body**: JSON object representing the newly created playlist.

Example Response:
```json
{
    "etag": "W0A20yar4_AdXHRF9duEtAp-lA4",
    "id": "PL_CEo5JUlGu12DLVn6F5MJcKqXQvITWrP",
    "kind": "youtube#playlist",
    "snippet": {
        "channelId": "UCCTQgS1uvsddPJ0mbnt5GGw",
        "channelTitle": "Tryone",
        "description": "descri",
        "localized": {
            "description": "descri",
            "title": "title added"
        },
        "publishedAt": "2023-07-20T14:34:09Z",
        "thumbnails": {
            "default": {
                "height": 90,
                "url": "https://i.ytimg.com/img/no_thumbnail.jpg",
                "width": 120
            },
            "high": {
                "height": 360,
                "url": "https://i.ytimg.com/img/no_thumbnail.jpg",
                "width": 480
            },
            "medium": {
                "height": 180,
                "url": "https://i.ytimg.com/img/no_thumbnail.jpg",
                "width": 320
            }
        },
        "title": "title added"
    }
}
```

**Response Fields**:
- `etag` (string): The ETag of the newly created playlist object.
- `id` (string): The ID of the newly created playlist.
- `kind` (string): The kind of the playlist object (in this case, "youtube#playlist").
- `snippet` (object): An object containing snippet information about the newly created playlist.
    - `channelId` (string): The ID of the YouTube channel that owns the playlist.
    - `channelTitle` (string): The title of the YouTube channel that owns the playlist.
    - `description` (string): The description of the newly created playlist.
    - `localized` (object): An object containing localized data for the newly created playlist, including localized title and description.
        - `description` (string): The localized description of the newly created playlist.
        - `title` (string): The localized title of the newly created playlist.
    - `publishedAt` (string): The timestamp when the playlist was published in ISO 8601 format.
    - `thumbnails` (object): An object containing URLs for different thumbnail images of the newly created playlist.
        - `default` (object): Default thumbnail image URL and dimensions.
            - `url` (string): The URL of the default thumbnail image.
            - `width` (integer): The width of the default thumbnail image.
            - `height` (integer): The height of the default thumbnail image.
        - `high` (object): High-quality thumbnail image URL and dimensions.
            - `url` (string): The URL of the high-quality thumbnail image.
            - `width` (integer): The width of the high-quality thumbnail image.
            - `height` (integer): The height of the high-quality thumbnail image.
        - `medium` (object): Medium-quality thumbnail image URL and dimensions.
            - `url` (string): The URL of the medium-quality thumbnail image.
            - `width` (integer): The width of the medium-quality thumbnail image.
            - `height` (integer): The height of the medium-quality thumbnail image.
        - `maxres` (object): Maximum resolution thumbnail image URL and dimensions (if available).
            - `url` (string): The URL of the maximum resolution thumbnail image.
            - `width` (integer): The width of the maximum resolution thumbnail image.
            - `height` (integer): The height of the maximum resolution thumbnail image.
        - `standard` (object): Standard resolution thumbnail image URL and dimensions (if available).
            - `url` (string): The URL of the standard resolution thumbnail image.
            - `width` (integer): The width of the standard resolution thumbnail image.
            - `height` (integer): The height of the standard resolution thumbnail image.
    - `title` (string): The title of the newly created playlist.


### 6. `POST /startLiveStream`

**Description**: This endpoint initiates a live stream on YouTube and returns the necessary information for streaming video content.

**Response Body**: JSON object representing the details of the live stream.

Example Response:
```json
{
    "newStreamId": "CTQgS1uvsddPJ0mbnt5GGw1689865098883178",
    "newStreamName": "ca09-sc9p-84mf-8hb6-9br3",
    "newStreamIngestionAddress": "rtmps://a.rtmps.youtube.com/live2",
    "newRtmpUrl": "rtmps://a.rtmps.youtube.com/live2/ca09-sc9p-84mf-8hb6-9br3",
    "new_broadcast_id": "oEkawFWLY40"
}
```

**Response Fields**:
- `newStreamId` (string): The ID of the newly created live stream.
- `newStreamName` (string): The unique name of the live stream.
- `newStreamIngestionAddress` (string): The ingestion address for the live stream.
- `newRtmpUrl` (string): The RTMP URL for the live stream, including the ingestion address and stream name.
- `new_broadcast_id` (string): The ID of the new broadcast associated with the live stream.

Please note that the actual values in the response may vary for each new live stream.

### Socket.IO Events

This API uses Socket.IO for real-time communication. The following Socket.IO events are supported:

#### 1. `connect`

## `connect` Event

**Description**: The `connect` event is triggered when a client successfully establishes a WebSocket connection with the server. This event indicates that the client is now connected and ready to send and receive real-time messages.

### Event Format:
```javascript
socket.on('connect', function() {
    // Code to handle connection
});
```

### Event Handler Function:
The event handler function for the `connect` event does not require any parameters.

### Event Trigger:
The `connect` event is automatically triggered when a client successfully establishes a WebSocket connection with the server. It occurs just once after the connection is established.

### Example Usage:
```javascript
// Client-side code (JavaScript)
// Assuming you have included the Socket.IO library and established a WebSocket connection with the server
var socket = io.connect('http://localhost:8000');

// Handle the connect event
socket.on('connect', function() {
    // Code to handle connection, e.g., display a message, enable certain functionality, etc.
    console.log('Connected to the server.');
});
```

#### 2. `disconnect`

## `disconnect` Event

**Description**: The `disconnect` event is triggered when a client loses its WebSocket connection with the server. This event indicates that the client is no longer connected to the server.

### Event Format:
```javascript
socket.on('disconnect', function() {
    // Code to handle disconnection
});
```

### Event Handler Function:
The event handler function for the `disconnect` event does not require any parameters.

### Event Trigger:
The `disconnect` event is automatically triggered when a client loses its WebSocket connection with the server. This can happen due to various reasons, such as network issues, closing the browser tab, or explicit disconnection.

### Example Usage:
```javascript
// Client-side code (JavaScript)
// Assuming you have included the Socket.IO library and established a WebSocket connection with the server
var socket = io.connect('http://localhost:8000');

// Handle the disconnect event
socket.on('disconnect', function() {
    // Code to handle disconnection, e.g., display a message, update UI, etc.
    console.log('Disconnected from the server.');
});
```

#### 3. `start_stream`

## `start_stream` WebSocket Request

**Description**: The `start_stream` WebSocket request is used by the client to initiate the video streaming process on the server. It provides the server with the stream key required to start streaming.

### Request Format:
```javascript
socket.emit('start_stream', streamKey);
```

### Parameters:
- `streamKey` (string): The stream key provided by the client. It is a unique identifier for the stream and is used to start the streaming process and associate the stream with a specific key.

### Response:
Upon receiving the `start_stream` request, the server will initiate the video streaming process and emit the `stream_id` event to send the stream ID back to the client.

## `stream_id` Emitted Event

**Description**: The `stream_id` event is emitted by the server in response to the `start_stream` request. It provides the client with the stream ID associated with the started stream. The stream ID is necessary for the client to send video stream data to the server.

### Event Format:
```javascript
socket.on('stream_id', function(data) {
    // Handle the stream ID received from the server
    var streamId = data.stream_id;
    // Use the streamId for further operations (e.g., sending video stream data)
});
```

### Data:
The `stream_id` event sends the stream ID as a JSON object with the following format:
```json
{
    "stream_id": "YOUR_STREAM_ID"
}
```

### Event Handler Function:
- `data` (object): The JSON object containing the stream ID information.
- `data.stream_id` (string): The stream ID associated with the started stream. This ID is used by the client to identify the specific stream on the server and send video stream data.

**Example Usage**:
```javascript
// Client-side code (JavaScript)
// Assuming you have established a WebSocket connection with the server
socket.emit('start_stream', 'YOUR_STREAM_KEY');

// Handle the stream_id event emitted by the server
socket.on('stream_id', function(data) {
    var streamId = data.stream_id;
    // Use the streamId for further operations (e.g., sending video stream data)
});
```

#### 4. `stop_stream`

## `stop_stream` Event

**Description**: The `stop_stream` event is used to signal the server to stop a video stream associated with a specific stream ID. This event is typically triggered when a client wants to stop streaming video to the server.

### Event Format:
```javascript
socket.emit('stop_stream', { stream_id: 'YOUR_STREAM_ID' });
```

### Event Data:
The `stop_stream` event requires a JSON object as its data with the following property:

- `stream_id` (string): The unique identifier of the video stream that the client wants to stop.

### Event Trigger:
The `stop_stream` event is triggered when a client invokes the event using the `emit` method on the client-side.

### Event Handler Function (Server-side):
On the server-side, you need to handle the `stop_stream` event using Socket.IO's event handler function. Here's a sample implementation:

```python
# Server-side code (Python with Flask-SocketIO)
@socketio.on('stop_stream')
def handle_stop_stream(data):
    stream_id = data.get('stream_id')
    # Code to stop the video stream associated with the provided stream_id
    # This might involve terminating the corresponding video streaming process.
    # You can implement the logic to handle stopping the stream as per your application's requirements.
```

### Example Usage:
```javascript
// Client-side code (JavaScript)
// Assuming you have included the Socket.IO library and established a WebSocket connection with the server
var socket = io.connect('http://localhost:8000');

// Trigger the stop_stream event when the client wants to stop streaming
var streamIdToStop = 'YOUR_STREAM_ID';
socket.emit('stop_stream', { stream_id: streamIdToStop });
```

#### 5. `stream_data``

## `stream_data` Event

**Description**: The `stream_data` event is used to send video stream data from the client to the server in real-time. This event is typically triggered when the client is actively streaming video and wants to send the video stream frames to the server.

### Event Format:
```javascript
socket.emit('stream_data', { stream_id: 'YOUR_STREAM_ID', stream: 'YOUR_VIDEO_STREAM_DATA' });
```

### Event Data:
The `stream_data` event requires a JSON object as its data with the following properties:

- `stream_id` (string): The unique identifier of the video stream to which the data belongs.
- `stream` (string or binary data): The actual video stream data. This can be a binary buffer or a base64-encoded string representing the video frames.

### Event Trigger:
The `stream_data` event is triggered when a client invokes the event using the `emit` method on the client-side. The event is typically triggered in a loop or at regular intervals to continuously send video frames as the client is streaming.

### Event Handler Function (Server-side):
On the server-side, you need to handle the `stream_data` event using Socket.IO's event handler function. Here's a sample implementation:

```python
# Server-side code (Python with Flask-SocketIO)
@socketio.on('stream_data')
def handle_stream_data(data):
    stream_id = data.get('stream_id')
    video_stream_data = data.get('stream')
    # Code to process the video stream data for the given stream_id
    # This might involve writing the received video frames to a file, passing the frames to a video processing pipeline, etc.
    # You can implement the logic to handle the video stream data as per your application's requirements.
```

### Example Usage:
```javascript
// Client-side code (JavaScript)
// Assuming you have included the Socket.IO library and established a WebSocket connection with the server
var socket = io.connect('http://localhost:8000');

// Assuming you have a function that captures video frames and converts them to binary data (or base64-encoded string)
function getVideoFrameData() {
    // Code to capture a video frame and convert it to binary data
    return 'BINARY_VIDEO_FRAME_DATA';
}

// Trigger the stream_data event to send video frames to the server continuously
setInterval(function() {
    var streamIdToSend = 'YOUR_STREAM_ID';
    var videoFrameData = getVideoFrameData();
    socket.emit('stream_data', { stream_id: streamIdToSend, stream: videoFrameData });
}, 100); // Send frames every 100 milliseconds (adjust the interval as needed)
```

**Note**: In the provided example, the client triggers the `stream_data` event by emitting it to the server and provides the `stream_id` to identify the stream and the `stream` containing the video frame data. The server then receives the data and performs the necessary actions to process the video stream data for the given `stream_id`.


### Error Responses

- `500 Internal Server Error`: Returned when an unexpected error occurs on the server.
- `400 Bad Request`: Returned when the request is malformed or missing required data.
- `401 Unauthorized`: Returned when the user is not authenticated or the authentication token is invalid.

## Example Usage

```python
# Python example using requests library
import requests

# Base URL
base_url = "http://localhost:8000/"

# Authenticate user (follow the redirected URL and grant permissions)
# ...

# Get authenticated user's YouTube channel information
response = requests.get(base_url + "channel")
print(response.json())

# Get user's playlists
response = requests.get(base_url + "playlists")
print(response.json())

# Create a new playlist
data = {
    "title": "Test Playlist",
    "description": "Test Description"
}
response = requests.post(base_url + "createPlaylist", data=data)
print(response.json())

# Start a live stream
response = requests.post(base_url + "startLiveStream")
print(response.json())
```

Example Usage (Python client):

python
Copy code
import requests
import base64

# Base URL
base_url = "http://localhost:8000/"

# Authenticate user (follow the redirected URL and grant permissions)


# Emit stream_data event with video data
stream_id = "test_stream_id"
video_data = b"..."  # Video data as bytes
base64_encoded_data = base64.b64encode(video_data).decode('utf-8')

socketio_test_client.emit('stream_data', {
    "stream_id": stream_id,
    "stream": base64_encoded_data
})

## Important Notes

- To access the API endpoints and Socket.IO events, users must be authenticated using Google OAuth 2.0.

