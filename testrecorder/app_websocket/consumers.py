import asyncio
import os
from time import sleep
import django
import ffmpeg
from channels.consumer import AsyncConsumer
from channels.db import database_sync_to_async
from django.core.cache import cache

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'testrecorder.settings')
django.setup()


# All setting are moved bellow the django setup to avoid import error in django setup process.
from youtube.utils import transition_broadcast
from youtube.models import UserProfile


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
        self.process_manager = FFmpegProcessManager(send=self.send)
        self.connection_in_progress = False

    async def websocket_connect(self, event):
        try:
            self.connection_in_progress = True

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
        self.connection_in_progress = False
        self.reconnection_attempts = 3
        self.reconnected = False

        while self.reconnection_attempts > 0:
            sleep(5)
            if self.connection_in_progress:
                self.reconnected = True
                break
            self.reconnection_attempts = self.reconnection_attempts - 1

        if not self.reconnected:
            self.process_manager.cleanup_on_disconnect(self.scope)

    async def process_text_event(self, text_data):
        """Process the text event"""
        if 'browser_sound' in text_data:
            rtmp_url = self.process_manager.handle_browser_sound(text_data)
            await self.send_ack_message("RTMP url received: " + rtmp_url)
        elif 'rtmp://a.rtmp.youtube.com' in text_data or 'rtmps://a.rtmps.youtube.com' in text_data:
            rtmp_url = self.process_manager.handle_rtmp_url(text_data)

            await self.send_ack_message("RTMP url received: " + rtmp_url)
        elif 'command' in text_data:
            await self.process_command_event(text_data.split(",", 1)[1])

    async def process_command_event(self, command):
        """Process the command event"""
        if command == 'end_broadcast':
            success = self.process_manager.process_manager_cleanup(self.scope)
            await self.send({"type": "websocket.send", "text": "Success" if success else "Failed"})

    async def process_bytes_event(self, bytes_data):
        """Process the bytes event"""
        self.process_manager.handle_bytes_data(bytes_data)

    async def send_ack_message(self, message):
        """Send acknowledgement message to frontend"""
        await self.send({"type": "websocket.send", "text": message})


class FFmpegProcessManager:
    """ Manages the FFmpeg process """

    def __init__(self, send=None):
        self.process = None
        self.rtmp_url = None
        self.audio_enabled = False

    def handle_browser_sound(self, text_data):
        """Handle the browser sound message"""
        self.audio_enabled = True
        self.rtmp_url = self.extract_rtmp_url(text_data)
        self.start_ffmpeg_process()

        return self.rtmp_url

    def handle_rtmp_url(self, data):
        """Handle the rtmp url message"""
        self.audio_enabled = False
        self.rtmp_url = data.strip()
        self.start_ffmpeg_process()

        return self.rtmp_url

    def end_broadcast(self, scope):
        """Ends the broadcast"""
        success = self.transition_broadcast(scope=scope)
        return success

    def cleanup_on_disconnect(self, scope):
        """Cleanup when the websocket disconnects"""
        if self.process:
            self.process_manager_cleanup(scope)

    def transition_broadcast(self, scope):
        """Transition the broadcast"""
        success = False
        if self.process:
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
                success = False

        return success

    async def process_manager_cleanup(self, scope):
        """Cleanup the process manager"""
        try:
            if self.process:
                await asyncio.sleep(30)
                self.process.terminate()
                self.process.wait()

        except Exception as e:
            print("Error while closing the ffmpeg process: ", e)

        finally:
            self.process = None
            success = self.transition_broadcast(scope)
            cache.delete(f"stream_dict{scope.get('user').id}")

            return success

    def handle_bytes_data(self, bytes_data):
        """Handle the bytes data message"""
        if self.process:
            self.process.stdin.write(bytes_data)

    def start_ffmpeg_process(self):
        """ Starts the FFMPEG process """
        try:
            input_args = {}
            if not self.audio_enabled:
                input_args = {'f': 'lavfi', 'i': 'anullsrc'}
            else:
                input_args = {}

            self.process = (
                ffmpeg.input('pipe:', **input_args)
                .output(
                    self.rtmp_url,
                    **{'f': 'flv'},
                    vcodec='libx264',
                    acodec='aac',
                    # Additional options for quality and speed.
                    preset='ultrafast',
                    tune='zerolatency',
                    attempt_recovery='10',
                    # recovery_wait_time='10',
                    crf=23,
                )
                .overwrite_output()
                .run_async(pipe_stdin=True)
            )
        except Exception as e:
            print("Error starting FFmpeg process: ", e)

    def extract_rtmp_url(self, data):
        """Extract the rtmp url from the data"""
        _, rtmp_url = data.split(",", 1)
        return rtmp_url.strip()
