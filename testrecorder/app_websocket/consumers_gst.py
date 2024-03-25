import asyncio
import os
import django

from channels.db import database_sync_to_async
from django.core.cache import cache
import gi
gi.require_version('Gst', '1.0')
from gi.repository import Gst


os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'testrecorder.settings')
django.setup()


from youtube.models import UserProfile
from youtube.utils import transition_broadcast
from channels.consumer import AsyncConsumer


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
            await self.process_text_event(event['text'])
        elif 'bytes' in event:
            await self.process_bytes_event(event['bytes'])

    async def websocket_disconnect(self, event):
        """Handle when websocket is disconnected"""
        self.process_manager.cleanup_on_disconnect(self.scope)

    async def process_text_event(self, text_data):
        """Process the text event"""
        # Process text data if needed
        pass

    async def process_bytes_event(self, bytes_data):
        """Process the bytes event"""
        await self.process_manager.handle_bytes_data(bytes_data)

class GStreamerProcessManager:
    """ Manages the GStreamer process """
    def __init__(self, send=None):
        self.pipeline = None
        self.rtmp_url = None
        self.audio_enabled = False
        self.video_appsrc = None
        self.audio_appsrc = None

    def handle_bytes_data(self, bytes_data):
        """Handle the bytes data message"""
        if self.pipeline:
            if self.video_appsrc:
                self.push_data_to_appsrc(self.video_appsrc, bytes_data)
            elif self.audio_appsrc:
                self.push_data_to_appsrc(self.audio_appsrc, bytes_data)

    def push_data_to_appsrc(self, appsrc, data):
        """Push data to appsrc"""
        try:
            buf = Gst.Buffer.new_wrapped(data)
            appsrc.emit("push-buffer", buf)
        except Exception as e:
            print("Error pushing data to appsrc:", e)

    def start_gstreamer_pipeline(self):
        """Start GStreamer pipeline"""
        Gst.init(None)
        command = self.generate_gstreamer_command()
        self.pipeline = Gst.parse_launch(command)
        self.pipeline.set_state(Gst.State.PLAYING)

    def generate_gstreamer_command(self):
        """Generate GStreamer command"""
        video_source = "appsrc name=videosrc is-live=true do-timestamp=true format=buffer"
        audio_source = "appsrc name=audiosrc is-live=true do-timestamp=true format=buffer"

        rtmp_url = self.rtmp_url

        video_pipeline = f"{video_source} ! videoconvert"
        audio_pipeline = f"{audio_source} ! audioconvert"

        if not self.audio_enabled:
            audio_pipeline = "audiotestsrc"

        pipeline = f"{video_pipeline} ! x264enc tune=zerolatency bitrate=500 speed-preset=ultrafast ! video/x-h264,stream-format=byte-stream,profile=baseline ! h264parse ! flvmux name=mux " \
                   f"{audio_pipeline} ! voaacenc ! aacparse ! mux. " \
                   f"mux. ! rtmpsink location={rtmp_url}"

        return pipeline

    def cleanup_on_disconnect(self, scope):
        """Cleanup when the websocket disconnects"""
        if self.pipeline:
            self.pipeline.set_state(Gst.State.NULL)
            self.pipeline = None


    def handle_browser_sound(self, text_data):
        """Handle the browser sound message"""
        self.audio_enabled = True
        self.rtmp_url = self.extract_rtmp_url(text_data)
        self.start_gstreamer_pipeline()

        return self.rtmp_url

    def handle_rtmp_url(self, data):
        """Handle the rtmp url message"""
        self.audio_enabled = False
        self.rtmp_url = self.extract_rtmp_url(data)
        self.start_gstreamer_pipeline()

        return self.rtmp_url

    def end_broadcast(self, scope):
        """Ends the broadcast"""
        success = self.transition_broadcast(scope=scope)
        return success

    def extract_rtmp_url(self, data):
        """Extract the rtmp url from the data"""
        _, rtmp_url = data.split(",", 1)
        return rtmp_url.strip()


# class GStreamerProcessManager:
#     """ Manages the GStreamer process """
#     def __init__(self, send=None):
#         self.pipeline = None
#         self.rtmp_url = None
#         self.audio_enabled = False

#     def handle_browser_sound(self, text_data):
#         """Handle the browser sound message"""
#         self.audio_enabled = True
#         self.rtmp_url = self.extract_rtmp_url(text_data)
#         self.start_gstreamer_pipeline()

#         return self.rtmp_url

    

    

#     def handle_bytes_data(self, bytes_data):
#         """Handle the bytes data message"""
#         pass  # Handle data if needed

#     def cleanup_on_disconnect(self, scope):
#         """Cleanup when the websocket disconnects"""
#         self.process_manager_cleanup(scope)

#     def transition_broadcast(self, scope):
#         """Transition the broadcast"""
#         success = False
#         # Perform transition if needed
#         return success

#     def process_manager_cleanup(self, scope):
#         """Cleanup the process manager"""
#         success = False
#         # Cleanup process manager
#         return success

#     def start_gstreamer_pipeline(self):
#         """Start GStreamer pipeline"""
#         Gst.init(None)
#         command = self.generate_gstreamer_command()
#         self.pipeline = Gst.parse_launch(command)
#         self.pipeline.set_state(Gst.State.PLAYING)

#     def generate_gstreamer_command(self):
#         """Generate GStreamer command"""
#         # Generate GStreamer command based on requirements
#         return "your_gstreamer_command_here"

#     def extract_rtmp_url(self, data):
#         """Extract the rtmp url from the data"""
#         _, rtmp_url = data.split(",", 1)
#         return rtmp_url.strip()
