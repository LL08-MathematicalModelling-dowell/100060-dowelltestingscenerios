import os
import django
from channels.consumer import AsyncConsumer
from channels.db import database_sync_to_async
from django.core.cache import cache
import subprocess
import gi
gi.require_version('Gst', '1.0')
from gi.repository import Gst, GObject

Gst.init(None)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'testrecorder.settings')
django.setup()


# All setting are moved bellow the django setup to avoid import error in django setup process.
from youtube.models import UserProfile
from youtube.utils import transition_broadcast


@database_sync_to_async
def get_user(api_key):
    """Get user based on the API key"""
    try:
        return UserProfile.objects.get(api_key=api_key).user
    except UserProfile.DoesNotExist:
        return None


class VideoConsumer(AsyncConsumer):
    """Socket Consumer that accept websocket connection and live stream"""

    def __init__(self):
        self.process_manager = GStreamerProcessManager(send=self.send)

    async def websocket_connect(self, event):
        try:
            query_string = self.scope.get("query_string", b"").decode("utf-8")
            if query_string:
                api_key = query_string.split('=')[-1]

                user = await get_user(api_key)
                if user:
                    self.scope['user'] = user
                    await self.send({"type": "websocket.accept"})
                else:
                    await self.send({"type": "websocket.close", "text": "UnAuthorised"})
                    await self.websocket_disconnect(event)
            else:
                await self.send({"type": "websocket.close", "text": "UnAuthorised"})
                await self.websocket_disconnect(event)
        except UserProfile.DoesNotExist:
            await self.send({"type": "websocket.close", "text": "UnAuthorised"})
            await self.websocket_disconnect(event)

    async def websocket_receive(self, event):
        """Receive message from WebSocket."""
        if 'text' in event:
            # print("text")
            await self.process_text_event(event['text'])
        elif 'bytes' in event:
            # print("bytes")
            await self.process_bytes_event(event['bytes'])

    async def websocket_disconnect(self, event):
        """Handle when websocket is disconnected"""
        self.process_manager.cleanup_on_disconnect(self.scope)

    async def process_text_event(self, text_data):
        """Process the text event"""
        if 'browser_sound' in text_data:
            # print("browser-sound")
            rtmp_url = self.process_manager.handle_browser_sound(text_data)
            await self.send_ack_message("RTMP url received: " + rtmp_url)
        elif 'rtmp://a.rtmp.youtube.com' in text_data or 'rtmps://a.rtmps.youtube.com' in text_data:
            # print("rtmp-url")
            rtmp_url = self.process_manager.handle_rtmp_url(text_data)
            await self.send_ack_message("RTMP url received: " + rtmp_url)
        elif 'command' in text_data:
            # print("command")
            await self.process_command_event(text_data.split(",", 1)[1])

    async def process_command_event(self, command):
        """Process the command event"""
        # print(f"commands - {command}")
        if command == 'end_broadcast':
            success = self.process_manager.process_manager_cleanup(self.scope)
            # success = self.process_manager.end_broadcast(self.scope)
            await self.send({"type": "websocket.send", "text": "Success" if success else "Failed"})

    async def process_bytes_event(self, bytes_data):
        """Process the bytes event"""
        # print("bytes data")
        self.process_manager.handle_bytes_data(bytes_data)

    async def send_ack_message(self, message):
        """Send acknowledgement message to frontend"""
        await self.send({"type": "websocket.send", "text": message})

"""
SETUP REQUIRED PACKAGES:
Here are the required packages for GStreamer:

pip install PyGObject

This will install the necessary GObject introspection bindings for Python. Make sure you have GStreamer installed on your system as well. The specific GStreamer packages might vary depending on your operating system. Here are examples for some common systems:

Ubuntu/Debian:
sudo apt-get install gstreamer1.0-plugins-base gstreamer1.0-plugins-good gstreamer1.0-plugins-bad gstreamer1.0-plugins-ugly gstreamer1.0-tools

Fedora:
sudo dnf install gstreamer1-plugins-base gstreamer1-plugins-good gstreamer1-plugins-bad-free gstreamer1-plugins-bad-free-extras gstreamer1-plugins-ugly gstreamer1-plugins-ugly-free
"""


class GStreamerProcessManager:
    """ Manages the GStreamer process """

    def __init__(self, send=None):
        self.pipeline = None
        self.rtmp_url = None
        self.audio_enabled = False
        self.appsrc = None  # Added appsrc element to handle incoming video data

    def handle_browser_sound(self, text_data):
        """Handle the browser sound message"""
        # print(f"Gst - browser sound..  url - {self.rtmp_url}")
        self.audio_enabled = True
        self.rtmp_url = self.extract_rtmp_url(text_data)
        self.start_gstreamer_pipeline()

        return self.rtmp_url

    def handle_rtmp_url(self, data):
        """Handle the rtmp url message"""
        self.audio_enabled = False
        self.rtmp_url = data.strip()
        # print(f"url - {self.rtmp_url}")
        self.start_gstreamer_pipeline()

        return self.rtmp_url

    def end_broadcast(self, scope):
        """Ends the broadcast"""
        success = self.transition_broadcast(scope=scope)
        return success

    def handle_bytes_data(self, bytes_data):
        """Handle the bytes data message"""
        # print(f"bytes-handle - Gst.. appsrc - {self.appsrc}")
        if self.appsrc:
            print("appsrc-ready")
            # Push incoming video data to appsrc
            buf = Gst.Buffer.new_wrapped(bytes_data)
            self.appsrc.emit("push-buffer", buf)

    def cleanup_on_disconnect(self, scope):
        """Cleanup when the websocket disconnects"""
        if self.pipeline:
            self.gstreamer_process_cleanup(scope)

    def transition_broadcast(self, scope):
        """Transition the broadcast"""
        success = False
        # print("transition")
        if self.pipeline:
            try:
                stream_dict = cache.get(
                    f"stream_dict{scope.get('user').id}", None)
                if stream_dict:
                    broadcast_status = 'complete'
                    trans_dict = transition_broadcast(
                        stream_dict.get('new_broadcast_id'),
                        broadcast_status,
                        scope=scope
                    )
                    if "error" not in trans_dict:
                        success = True
                    else:
                        print(f"Failed to transition broadcast {trans_dict}")
            except Exception as err:
                print("Failed to transition broadcast:", err)

        return success

    def gstreamer_process_cleanup(self, scope):
        """Cleanup the GStreamer process manager"""
        print("cleanup - func")
        if self.pipeline:
            self.pipeline.set_state(Gst.State.NULL)
            self.transition_broadcast(scope=scope)
        self.pipeline = None

    def start_gstreamer_pipeline(self):
        try:
            # Create GStreamer pipeline
            self.pipeline = Gst.Pipeline()

            # Add elements to the pipeline
            self.appsrc = Gst.ElementFactory.make("appsrc", "app-source")
            decodebin = Gst.ElementFactory.make("decodebin", "decoder")
            x264enc = Gst.ElementFactory.make("x264enc", "video-encoder")
            flvmux = Gst.ElementFactory.make("flvmux", "flv-muxer")
            rtmpsink = Gst.ElementFactory.make("rtmpsink", "rtmp-sink")

             # Print element names for debugging
            print("appsrc:", self.appsrc.get_name())
            print("decodebin:", decodebin.get_name())
            print("x264enc:", x264enc.get_name())
            print("flvmux:", flvmux.get_name())
            print("rtmpsink:", rtmpsink.get_name())

            # Set appsrc properties
            self.appsrc.set_property("caps", Gst.Caps.from_string("video/x-raw, format=RGB"))  # Example caps
            self.appsrc.set_property("is-live", True)
            self.appsrc.set_property("format", Gst.Format.TIME)

            # Check if elements were created successfully
            if not self.appsrc or not decodebin or not x264enc or not flvmux or not rtmpsink:
                print("Not all elements could be created")
                # self.gstreamer_process_cleanup(scope)
                return

            # Set properties for elements
            rtmpsink.set_property("location", self.rtmp_url)

            # Add elements to the pipeline
            self.pipeline.add(self.appsrc)
            self.pipeline.add(decodebin)
            self.pipeline.add(x264enc)
            self.pipeline.add(flvmux)
            self.pipeline.add(rtmpsink)

            # Link elements in the pipeline
            self.appsrc.link(decodebin)
            decodebin.link(x264enc)
            x264enc.link(flvmux)
            flvmux.link(rtmpsink)

            # Set the pipeline state to playing
            self.pipeline.set_state(Gst.State.PLAYING)

        except Exception as e:
            print("Error starting GStreamer pipeline:", e)
            # self.gstreamer_process_cleanup(scope)

    def extract_rtmp_url(self, data):
        """Extract the rtmp url from the data"""
        _, rtmp_url = data.split(",", 1)
        return rtmp_url.strip()

# class FFmpegProcessManager:
#     """ Manages the FFmpeg process """

#     def __init__(self, send=None):
#         self.process = None
#         self.rtmp_url = None
#         self.audio_enabled = False

#     def handle_browser_sound(self, text_data):
#         """Handle the browser sound message"""
#         self.audio_enabled = True
#         self.rtmp_url = self.extract_rtmp_url(text_data)
#         self.start_ffmpeg_process()

#         return self.rtmp_url

#     def handle_rtmp_url(self, data):
#         """Handle the rtmp url message"""
#         self.audio_enabled = False
#         self.rtmp_url = data.strip()
#         self.start_ffmpeg_process()

#         return self.rtmp_url

#     def end_broadcast(self, scope):
#         """Ends the broadcast"""
#         success = self.transition_broadcast(scope=scope)
#         return success

#     def handle_bytes_data(self, bytes_data):
#         """Handle the bytes data message"""
#         if self.process:
#             self.process.stdin.write(bytes_data)

#     def cleanup_on_disconnect(self, scope):
#         """Cleanup when the websocket disconnects"""
#         if self.process:

#             self.process_manager_cleanup(scope)
#             # _ = self.transition_broadcast(scope)
#             # cache.delete(f"stream_dict{scope.get('user').id}")

#     def transition_broadcast(self, scope):
#         """Transition the broadcast"""
#         success = False
#         if self.process:
#             try:
#                 stream_dict = cache.get(
#                     f"stream_dict{scope.get('user').id}", None)
#                 if stream_dict:
#                     broadcast_status = 'complete'
#                     trans_dict = transition_broadcast(
#                         stream_dict.get('new_broadcast_id'),
#                         broadcast_status,
#                         scope=scope
#                     )
#                     if "error" not in trans_dict:
#                         success = True
#                     else:
#                         print(f"Failed to transition broadcast {trans_dict}")

#             except Exception as err:
#                 success = False

#         return success

#     def process_manager_cleanup(self, scope):
#         """Cleanup the process manager"""
#         try:
#             if self.process:
#                 if not self.process.stdin.closed:
#                     self.process.stdin.close()

#                 _, stderr = self.process.communicate(timeout=35)

#                 if stderr:
#                     print("Error in subprocess stderr:", stderr)

#                 self.process.wait()
#         except subprocess.TimeoutExpired:
#             self.process.terminate()

#         except Exception as e:
#             print("Error while closing the subprocess: ", e)

#         finally:
#             self.process = None
#             success = self.transition_broadcast(scope)
#             cache.delete(f"stream_dict{scope.get('user').id}")

#             return success

#     def start_ffmpeg_process(self):
#         # try:
#         command = self.generate_ffmpeg_command()
#         self.process = subprocess.Popen(
#             command, stdin=subprocess.PIPE,
#             stdout=subprocess.PIPE,
#             stderr=subprocess.PIPE,
#         )
#         # except Exception as e:
#             # print("Error starting FFmpeg process: ", e)

#     def generate_ffmpeg_command(self):
#         # common_options = [
#         #     'ffmpeg',
#         #     '-vcodec', 'copy',
#         #     '-acodec', 'aac',
#         #     '-f', 'flv',
#         #     '-preset', 'ultrafast',
#         #     self.rtmp_url,
#         # ]
#         common_options = [
#             'ffmpeg',
#             '-vcodec', 'copy',
#             '-acodec', 'aac',
#             '-f', 'flv',
#             '-preset', 'ultrafast',
#             '-tune', 'zerolatency',  # Enable zerolatency tuning
#             self.rtmp_url,
#         ]

#         if not self.audio_enabled:
#             return common_options + [
#                 '-f', 'lavfi', '-i', 'anullsrc',
#                 '-i', '-',
#                 '-shortest',
#             ]

#         return common_options + ['-i', '-']

#     def extract_rtmp_url(self, data):
#         """Extract the rtmp url from the data"""
#         _, rtmp_url = data.split(",", 1)
#         return rtmp_url.strip()
