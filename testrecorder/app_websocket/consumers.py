
from youtube.utils import transition_broadcast
from youtube.models import UserProfile
import os
import subprocess
import asyncio
import django
from channels.consumer import AsyncConsumer
from channels.db import database_sync_to_async
from django.core.cache import cache


os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'testrecorder.settings')
django.setup()


# All setting are moved bellow the django setup to avoid import error in django setup process.


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

    # async def websocket_connect(self, event):
    #     try:
    #         query_string = self.scope.get("query_string", b"").decode("utf-8")
    #         if query_string:
    #             api_key = query_string.split('=')[-1]

    #             user = await get_user(api_key)
    #             if user:
    #                 self.scope['user'] = user
    #                 await self.send({"type": "websocket.accept"})
    #             else:
    #                 await self.send({"type": "websocket.close", "text": "UnAuthorised"})
    #                 await self.websocket_disconnect(event)
    #         else:
    #             await self.send({"type": "websocket.close", "text": "UnAuthorised"})
    #             await self.websocket_disconnect(event)
    #     except UserProfile.DoesNotExist:
    #         await self.send({"type": "websocket.close", "text": "UnAuthorised"})
    #         await self.websocket_disconnect(event)

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

    # async def websocket_disconnect(self, event):
    #     """Handle when websocket is disconnected"""
    #     self.process_manager.cleanup_on_disconnect(self.scope)

    async def websocket_disconnect(self, event):
        """Handle when websocket is disconnected"""
        try:
            await asyncio.wait_for(self.wait_for_reconnect(), timeout=5)
            # Reconnection happened within 5 seconds, do nothing
        except asyncio.TimeoutError:
            # No reconnection happened within 5 seconds, proceed with cleanup
            if not self.is_connected:
                self.process_manager.cleanup_on_disconnect(self.scope)

    async def wait_for_reconnect(self):
        """Wait for a reconnection attempt"""
        self.is_connected = False  # Mark connection as lost
        await asyncio.sleep(5)  # Wait for 5 seconds for a reconnection attempt
        # If this method is not cancelled within 5 seconds, it means no reconnection attempt occurred
        # Set is_connected back to True if reconnected during this period
        self.is_connected = True

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
            # success = self.process_manager.end_broadcast(self.scope)
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

    def handle_bytes_data(self, bytes_data):
        """Handle the bytes data message"""
        if self.process:
            self.process.stdin.write(bytes_data)

    def cleanup_on_disconnect(self, scope):
        """Cleanup when the websocket disconnects"""
        if self.process:

            self.process_manager_cleanup(scope)
            # _ = self.transition_broadcast(scope)
            # cache.delete(f"stream_dict{scope.get('user').id}")

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

    def process_manager_cleanup(self, scope):
        """Cleanup the process manager"""
        try:
            if self.process:
                if not self.process.stdin.closed:
                    self.process.stdin.close()

                _, stderr = self.process.communicate(timeout=35)

                if stderr:
                    print("Error in subprocess stderr:", stderr)

                self.process.wait()
        except subprocess.TimeoutExpired:
            self.process.terminate()

        except Exception as e:
            print("Error while closing the subprocess: ", e)

        finally:
            self.process = None
            success = self.transition_broadcast(scope)
            cache.delete(f"stream_dict{scope.get('user').id}")

            return success

    def start_ffmpeg_process(self):
        try:
            command = self.generate_ffmpeg_command()
            self.process = subprocess.Popen(
                command, stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
            )
        except Exception as e:
            print("Error starting FFmpeg process: ", e)

    def generate_ffmpeg_command(self):
        # common_options = [
        #     'ffmpeg',
        #     '-vcodec', 'copy',
        #     '-acodec', 'aac',
        #     '-f', 'flv',
        #     '-preset', 'ultrafast',
        #     self.rtmp_url,
        # ]
        common_options = [
            'ffmpeg',
            '-vcodec', 'copy',
            '-acodec', 'aac',
            '-f', 'flv',
            '-preset', 'ultrafast',
            '-tune', 'zerolatency',  # Enable zerolatency tuning
            self.rtmp_url,
        ]

        if not self.audio_enabled:
            return common_options + [
                '-f', 'lavfi', '-i', 'anullsrc',
                '-i', '-',
                '-shortest',
            ]

        return common_options + ['-i', '-']

    def extract_rtmp_url(self, data):
        """Extract the rtmp url from the data"""
        _, rtmp_url = data.split(",", 1)
        return rtmp_url.strip()
