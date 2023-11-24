import uuid
import subprocess

# The VideoStreamer class provides methods to start and stop streaming video to YouTube using ffmpeg.
class VideoStreamer:

    """
    The function initializes a class instance with a base URL for YouTube's RTMP streaming and an
    empty dictionary to store active streams.
    """
    def __init__(self):
        self.youtube_rtmp_url_base = 'rtmp://a.rtmp.youtube.com/live2/'
        self.streams = {}  # Dictionary to store active streams

    def start_streaming(self, stream_key):
        stream_id = str(uuid.uuid4())  # Generate a new stream_id for each call
        youtube_rtmp_url = self.youtube_rtmp_url_base + stream_key

# The `ffmpeg_command` is a list that contains the command and its arguments to execute the `ffmpeg`
# program.
        ffmpeg_command = [
            'ffmpeg',
            '-i', '-',
            '-c:v', 'libx264',
            '-pix_fmt', 'yuv420p',
            '-bufsize', '512k',
            '-f', 'flv',
            youtube_rtmp_url,
            '-max_delay', '100',
            '-rtmp_buffer', '100',
            '-rtmp_live', '1'
        ]

# The `subprocess.Popen()` function is used to create a new process and execute the `ffmpeg` command
# with the specified arguments.
        ffmpeg_process = subprocess.Popen(
            ffmpeg_command,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )

        self.streams[stream_id] = ffmpeg_process
        return stream_id

    """
    The `stop_streaming` function stops a streaming process identified by `stream_id` by closing its
    input stream, terminating the process, waiting for it to finish, and removing it from the `streams`
    dictionary.
    
    :param stream_id: The `stream_id` parameter is the identifier of the streaming process that you want
    to stop. It is used to locate the specific streaming process in the `self.streams` dictionary
    :return: a boolean value. If the `stream_id` exists in the `self.streams` dictionary and the
    corresponding `ffmpeg_process` is found, the function will close the stdin, terminate the process,
    wait for it to finish, remove the `stream_id` from the dictionary, and return `True`. If the
    `stream_id` does not exist in the dictionary or the corresponding
    """
    def stop_streaming(self, stream_id):
        ffmpeg_process = self.streams.get(stream_id)
        if ffmpeg_process:
            ffmpeg_process.stdin.close()
            ffmpeg_process.terminate()
            ffmpeg_process.wait()
            del self.streams[stream_id]
            return True
        return False
    
