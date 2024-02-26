
from youtube.utils import transition_broadcast
from youtube.models import UserProfile
import os
# import subprocess
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
        self.process = None
        self.rtmpUrl = None
        self.audio_enabled = False
        self.receive_event = asyncio.Event()
     
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
        """
        Receive message from WebSocket.
        Get the event and send the appropriate event
        """
        if 'text' in event.keys():
            data = event['text']
            if 'browser_sound' in data:
                self.audio_enabled = True
                self.rtmpUrl = self.extract_rtmp_url(data)
                print("Received RTMP url: ", self.rtmpUrl)
                await self.start_ffmpeg_process()
                await self.send_ack_message("RTMP url received: " + self.rtmpUrl)
            elif 'rtmp://a.rtmp.youtube.com' in data or 'rtmps://a.rtmps.youtube.com' in data:
                self.audio_enabled = False
                self.rtmpUrl = data
                # print("Received RTMP url:", self.rtmpUrl)
                await self.start_ffmpeg_process()
                await self.send_ack_message("RTMP url received: " + self.rtmpUrl)
            elif 'ping' in data:
                print('================ pong response recieved ================')
                await self.send_ack_message('pong')

        if 'bytes' in event.keys() and self.process:
            # print(event['bytes'])
            byte_data = event['bytes']
            if self.process and self.process.returncode is None:
                try:
                    self.process.stdin.write(byte_data)
                    await self.process.stdin.drain()
                except BrokenPipeError as e:
                    # Handle the error or take appropriate action
                    await self.restart_ffmpeg_process()
                    self.process.stdin.write(byte_data)
                    await self.process.stdin.drain()
            else:
                print("Subprocess has terminated. Cannot write to stdin.")
                await self.restart_ffmpeg_process()
                self.process.stdin.write(byte_data)
                await self.process.stdin.drain()

        # Set the event to signal that websocket_receive has completed
        self.receive_event.set()
            
    async def websocket_disconnect(self, event):
        """when websocket disconnects"""
        self.connection_lost = True
        print("Websocket disconnected...")

        # Wait to hear from `websocket_receive` success before going further.
        await self.receive_event.wait()


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

    async def start_ffmpeg_process(self):
        """
        Starts the rtmp process.
        """
        try:
            command = self.generate_ffmpeg_command()
            self.process = await asyncio.create_subprocess_exec(
                *command, stdin=asyncio.subprocess.PIPE,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
        except Exception as e:
            print("Error starting FFmpeg process: ", e)

    async def stop_ffmpeg_process(self):
        """
        Stops the RTMP process...
        """
        if self.process:
            try:
                self.process.stdin.close()
                await asyncio.wait_for(self.process.wait(), timeout=30)
            except asyncio.TimeoutError:
                print("Timeout waiting for the subprocess to finish.")
                await self.stop_ffmpeg_process()
            except Exception as e:
                print("Error while closing the subprocess: ", e)
            finally:
                self.process = None

    async def restart_ffmpeg_process(self):
        print("Restarting FFmpeg process...")
        await self.stop_ffmpeg_process()
        await self.start_ffmpeg_process()

    def generate_ffmpeg_command(self):
        """Common FFmpeg command generation based on audio_enabled flag.
        The command adds streams at almost real-time.
        """
        command = [
            'ffmpeg',
            '-i', '-',
            '-c:v', 'libx264',
            '-c:a', 'aac',
            '-f', 'fifo',
            '-fifo_format', 'flv',
            '-map', '0:v',
            '-map', '0:a',
            '-drop_pkts_on_overflow', '1',
            '-attempt_recovery', '10',
            '-recovery_wait_time', '30',
            self.rtmpUrl
        ]

        if not self.audio_enabled:
            # Add additional options if audio is not enabled
            command = [
                'ffmpeg',
                '-i', '-',
                '-c:v', 'libx264',
                '-f', 'fifo',
                '-fifo_format', 'flv',
                '-map', '0:v',
                '-drop_pkts_on_overflow', '1',
                '-attempt_recovery', '10',
                '-recovery_wait_time', '30',
                self.rtmpUrl
        ]
        return common_options + ['-i', '-']

    def extract_rtmp_url(self, data):
        """Extract the rtmp url from the data"""
        _, rtmp_url = data.split(",", 1)
        return rtmp_url.strip()
