from channels.consumer import AsyncConsumer
from channels.db import database_sync_to_async
from django.core.cache import cache
from youtube.models import UserProfile
from youtube.utils import transition_broadcast
import django
import os
import gi
gi.require_version('Gst', '1.0')
from gi.repository import Gst, GLib
import asyncio

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'yourproject.settings')
django.setup()

Gst.init(None)

@database_sync_to_async
def get_user(api_key):
    """Get user based on the API key."""
    try:
        return UserProfile.objects.get(api_key=api_key).user
    except UserProfile.DoesNotExist:
        return None

class VideoConsumer(AsyncConsumer):
    """Socket Consumer that accepts WebSocket connection and live stream."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.pipeline = None
        self.loop = None

    async def websocket_connect(self, event):
        await self.accept()

        query_string = self.scope.get("query_string", b"").decode("utf-8")
        api_key = query_string.split('=')[-1]
        user = await get_user(api_key)
        if user:
            self.scope['user'] = user
        else:
            await self.send({"type": "websocket.close", "text": "Unauthorized"})
            return

        # Start GLib event loop in a separate thread for GStreamer
        self.loop = GLib.MainLoop()
        asyncio.get_event_loop().run_in_executor(None, self.loop.run)

    async def websocket_disconnect(self, event):
        """Stop GStreamer pipeline on disconnect."""
        if self.pipeline:
            self.pipeline.set_state(Gst.State.NULL)
        if self.loop:
            self.loop.quit()

    async def websocket_receive(self, event):
        """Handle messages from WebSocket."""
        # Example handler to start streaming based on received text
        if 'text' in event:
            text_data = event['text']
            if text_data == "start_stream":
                await self.start_streaming("your_youtube_rtmp_url")
            elif text_data == "stop_stream":
                await self.stop_streaming()

    async def start_streaming(self, rtmp_url):
        """Start the GStreamer pipeline for streaming."""
        # Define GStreamer pipeline here, replace videotestsrc with your video source
        pipeline_str = f"""
            videotestsrc is-live=true ! videoconvert ! x264enc tune=zerolatency bitrate=500 speed-preset=superfast ! flvmux streamable=true ! rtmpsink location='{rtmp_url}'
        """
        self.pipeline = Gst.parse_launch(pipeline_str)
        self.pipeline.set_state(Gst.State.PLAYING)

    async def stop_streaming(self):
        """Stop the GStreamer pipeline."""
        if self.pipeline:
            self.pipeline.set_state(Gst.State.NULL)
