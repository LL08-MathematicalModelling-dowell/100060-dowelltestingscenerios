# import json
import os
import subprocess
import asyncio
import django
from channels.consumer import AsyncConsumer
import threading
# from channels.generic.websocket import AsyncWebsocketConsumer
# from django.conf import settings

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'testrecorder.settings')
django.setup()


# from youtube.views import create_broadcast, insert_video_into_playlist, transition_broadcast
# from file_app.views import save_recording_metadata

class VideoConsumer(AsyncConsumer):
    """
    Socket Consumer that accept websocket connection and live stream
     data from frontend and sends this stream to youtube
    """

    def __init__(self):
        self.process = None
        self.rtmpUrl = None
        self.audio_enabled = False
        # self.receive_event = asyncio.Event()

    async def websocket_connect(self, event):
        """
        Handle when websocket is connected
            :param event: websocket connection event
            :return: None
        """
        # print("WebSocket connected:", event)
        await self.send({"type": "websocket.accept"})

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
                print("Received RTMP url:", self.rtmpUrl)
                await self.start_ffmpeg_process()
                await self.send_ack_message("RTMP url received: " + self.rtmpUrl)
            elif 'ping' in data:
                print('================ pong response recieved ================')
                await self.send_ack_message('pong')

        if 'bytes' in event.keys() and self.process:
            # print(event['bytes'])
            byte_data = event['bytes']
            # if self.process and self.process.returncode is None:
            #     print(self.process, self.process.returncode)
            try:
                self.process.stdin.write(byte_data)
                await self.process.stdin.drain()
            except (BrokenPipeError, ConnectionResetError) as e:
                # Handle the error or take appropriate action
                await self.restart_ffmpeg_process()
                self.process.stdin.write(byte_data)
                await self.process.stdin.drain()
            # else:
            #     print("Subprocess has terminated. Cannot write to stdin.")
            #     await self.restart_ffmpeg_process()
            #     self.process.stdin.write(byte_data)
            #     await self.process.stdin.drain()

        # Set the event to signal that websocket_receive has completed
        # self.receive_event.set()

    async def websocket_disconnect(self, event):
        """when websocket disconnects"""
        self.connection_lost = True
        print("Websocket disconnected...")

        # Wait to hear from `websocket_receive` success before going further.
        # await self.receive_event.wait()

        if self.process:
            try:
                # Close the stdin of the subprocess to prevent BrokenPipeError
                self.process.stdin.close()
                # Wait for the subprocess to finish
                self.process.wait()
            except Exception as e:
                print("Error while closing the subprocess: ", e)
            finally:
                # Set the process attribute to None to indicate no active process
                self.process = None

    def extract_rtmp_url(self, data):
        """Extract RTMP URL from the data received"""
        _, rtmp_url = data.split(",", 1)
        return rtmp_url.strip()

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
            print("Process Started: ", self.process)
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
            # command = [
            #     'ffmpeg',
            #     '-i', '-',
            #     '-c:v', 'libx264',
            #     '-f', 'fifo',
            #     '-fifo_format', 'flv',
            #     '-map', '0:v',
            #     '-drop_pkts_on_overflow', '1',
            #     '-attempt_recovery', '10',
            #     '-recovery_wait_time', '30',
            #     self.rtmpUrl
            # ]

            command = [
                'ffmpeg',
                '-f', 'lavfi', '-i', 'anullsrc',
                '-i', '-',
                '-shortest',
                # '-vcodec', 'copy',
                '-c:v', 'libx264',
                '-b:v', '4k',
                '-acodec', 'aac',
                '-drop_pkts_on_overflow', '1',
                '-attempt_recovery', '10',
                '-recovery_wait_time', '30',
                '-f', 'flv',
                self.rtmpUrl
            ]

        return command

    async def send_ack_message(self, message):
        """Send acknowledgement message to frontend"""
        await self.send({"type": "websocket.send", "text": message})

