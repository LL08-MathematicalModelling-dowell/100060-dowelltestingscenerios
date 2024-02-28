import os
import asyncio
import django
from channels.consumer import AsyncConsumer

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'testrecorder.settings')
django.setup()


class VideoConsumer(AsyncConsumer):
    """
    Socket Consumer that accepts websocket connection and live streams
    data from frontend and sends this stream to YouTube
    """

    def __init__(self):
        super().__init__()
        self.process = None
        self.rtmpUrl = None
        self.audio_enabled = False

    async def websocket_connect(self, event):
        """
        Handle when websocket is connected
        """
        await self.send({"type": "websocket.accept"})

    async def websocket_receive(self, event):
        """
        Receive message from WebSocket.
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
                print('================ pong response received ================')
                await self.send_ack_message('pong')

        if 'bytes' in event.keys() and self.process:
            byte_data = event['bytes']
            try:
                self.process.stdin.write(byte_data)
                await self.process.stdin.drain()
            except (BrokenPipeError, ConnectionResetError) as e:
                await self.restart_ffmpeg_process()
                self.process.stdin.write(byte_data)
                await self.process.stdin.drain()

    async def websocket_disconnect(self, event):
        """Handle websocket disconnection."""
        self.connection_lost = True
        print("Websocket disconnected...")

        if self.process:
            try:
                self.process.stdin.close()
                self.process.wait()
            except Exception as e:
                print("Error while closing the subprocess: ", e)
            finally:
                self.process = None

    def extract_rtmp_url(self, data):
        """Extract RTMP URL from the received data."""
        _, rtmp_url = data.split(",", 1)
        return rtmp_url.strip()

    async def start_ffmpeg_process(self):
        """Start the RTMP process."""
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
        """Stop the RTMP process."""
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
        """Restart the FFmpeg process."""
        print("Restarting FFmpeg process...")
        await self.stop_ffmpeg_process()
        await self.start_ffmpeg_process()

    def generate_ffmpeg_command(self):
        """Generate FFmpeg command based on audio_enabled flag."""
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
            command = [
                'ffmpeg',
                '-f', 'lavfi', '-i', 'anullsrc',
                '-i', '-',
                '-shortest',
                '-c:v', 'libx264',
                '-b:v', '4000k',
                '-acodec', 'aac',
                '-drop_pkts_on_overflow', '1',
                '-attempt_recovery', '10',
                '-recovery_wait_time', '30',
                '-f', 'flv',
                self.rtmpUrl
            ]

        return command

    async def send_ack_message(self, message):
        """Send acknowledgment message to frontend."""
        await self.send({"type": "websocket.send", "text": message})
