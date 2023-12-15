import asyncio
import os
import subprocess

import django
from channels.consumer import AsyncConsumer
from django.core.cache import cache
from youtube.utils import transition_broadcast

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'testrecorder.settings')
django.setup()


class VideoConsumer(AsyncConsumer):
    """
    Socket Consumer that accepts websocket connection and live stream
    data from frontend and sends this stream to YouTube.
    """

    def __init__(self):
        self.process = None
        self.rtmp_url = None
        self.audio_enabled = False

    async def websocket_connect(self, event):
        """
        Handle when the websocket is connected.
        param event: WebSocket connection event
        return: None
        """
        print("self", self)
        await self.send({"type": "websocket.accept"})

    async def websocket_receive(self, event):
        """
        Receive a message from WebSocket.
        Get the event and send the appropriate event.
        """
        if 'text' in event.keys():
            data = event['text']
            if 'browser_sound' in data:
                self.audio_enabled = True
                self.rtmp_url = self.extract_rtmp_url(data)
                self.start_ffmpeg_process()
                await self.send_ack_message("RTMP url received: " + self.rtmp_url)
            elif 'rtmp://a.rtmp.youtube.com' in data or 'rtmps://a.rtmps.youtube.com' in data:
                self.audio_enabled = False
                self.rtmp_url = data.strip()
                self.start_ffmpeg_process()
                await self.send_ack_message("RTMP url received: " + self.rtmp_url)
        if 'command' in event.keys():
            success = False
            if event['command'] == 'end_broadcast':
                if self.process:
                    try:
                        print("Transitioning broadcast")
                        try:
                            stream_dict = cache.get(f"stream_dict{self.scope.get('user').id}", None)
                            if stream_dict:
                                broadcast_status = 'complete'
                                trans_dict = transition_broadcast(
                                    stream_dict.get('new_broadcast_id'),
                                    broadcast_status,
                                    scope=self.scope
                                )
                                if "error" not in trans_dict:
                                    print(f"Transitioned broadcast {trans_dict}")
                                    success = True
                                else:
                                    print(f"Failed to transition broadcast {trans_dict}")

                        except Exception as err:
                            print(f"Failed to transition broadcast! >>>>>> {err}")
                            success = False
                        # Wait for the subprocess to finish with a timeout
                        await asyncio.wait_for(self.process.wait(), timeout=5)

                    except asyncio.TimeoutError:
                        print("Timeout waiting for subprocess to terminate. Forcing termination.")
                        self.process.terminate()
                    except Exception as e:
                        print("Error while closing the subprocess: ", e)
                    finally:
                        # Set the process attribute to None to indicate no active process
                        self.process = None

                await self.send_ack_message({"message": "Broadcast ended successfully" if success else "Broadcast failed to end"})
        if 'bytes' in event.keys() and self.process:
            bytes_data = event['bytes']
            if self.process and not self.process.stdin.closed:
                self.process.stdin.write(bytes_data)
                print(f'Bytes received: {len(bytes_data)}')
            else:
                print("Process not found or stdin closed")

    async def websocket_disconnect(self, event):
        """When the websocket disconnects."""
        stream_dict = cache.get(f"stream_dict{self.scope.get('user').id}", None)
        if stream_dict:
            broadcast_status = 'complete'
            trans_dict = transition_broadcast(
                stream_dict.get('new_broadcast_id'),
                broadcast_status,
                scope=self.scope
            )
            if "error" not in trans_dict:
                print(f"Transitioned broadcast {trans_dict}")
            else:
                print(f"Failed to transition broadcast {trans_dict}")

        cache.delete(f"stream_dict{self.scope.get('user').id}")

        if self.process:
            try:
                await asyncio.wait_for(self.process.communicate(), timeout=5)
            except asyncio.TimeoutError:
                print("Timeout waiting for subprocess to terminate. Forcing termination.")
                self.process.terminate()
            except Exception as e:
                print("Error while closing the subprocess: ", e)
            finally:
                self.process = None

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
        """Common FFmpeg command generation based on the audio_enabled flag."""
        command = [
            'ffmpeg',
            '-i', '-',
            '-vcodec', 'copy',
            '-acodec', 'aac',
            '-f', 'flv',
            self.rtmp_url
        ]

        if not self.audio_enabled:
            command = [
                'ffmpeg',
                '-f', 'lavfi', '-i', 'anullsrc',
                '-i', '-',
                '-shortest',
                '-vcodec', 'copy',
                '-acodec', 'aac',
                '-f', 'flv',
                self.rtmp_url
            ]

        return command

    def extract_rtmp_url(self, data):
        """Extract RTMP URL from the data received."""
        _, rtmp_url = data.split(",", 1)
        return rtmp_url.strip()

    async def send_ack_message(self, message):
        """Send an acknowledgement message to the frontend."""
        await self.send({"type": "websocket.send", "text": message})
