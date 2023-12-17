# import os
# import subprocess

# import django
# from channels.consumer import AsyncConsumer
# from django.core.cache import cache
# from youtube.utils import transition_broadcast

# os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'testrecorder.settings')
# django.setup()


# class VideoConsumer(AsyncConsumer):
#     def __init__(self):
#         self.process_manager = FFmpegProcessManager(send=self.send)

#     async def websocket_connect(self, event):
#         await self.send({"type": "websocket.accept"})

#     async def websocket_receive(self, event):
#         if 'text' in event:
#             self.process_text_event(event['text'])
#         elif 'command' in event:
#             self.process_command_event(event['command'])
#         elif 'bytes' in event:
#             self.process_bytes_event(event['bytes'])

#     async def websocket_disconnect(self, event):
#         self.process_manager.cleanup_on_disconnect(self.scope)

#     def process_text_event(self, text_data):
#         if 'browser_sound' in text_data:
#             self.process_manager.handle_browser_sound(text_data)
#         elif 'rtmp://a.rtmp.youtube.com' in text_data or 'rtmps://a.rtmps.youtube.com' in text_data:
#             self.process_manager.handle_rtmp_url(text_data)

#     def process_command_event(self, command):
#         if command == 'end_broadcast':
#             self.process_manager.end_broadcast(self.scope)

#     def process_bytes_event(self, bytes_data):
#         self.process_manager.handle_bytes_data(bytes_data)


# class FFmpegProcessManager:
#     def __init__(self, send=None):
#         self.process = None
#         self.rtmp_url = None
#         self.audio_enabled = False
#         self.send = send

#     def handle_browser_sound(self, text_data):
#         self.audio_enabled = True
#         self.rtmp_url = self.extract_rtmp_url(text_data)
#         self.start_ffmpeg_process()
#         self.send_ack_message("RTMP url received: " + self.rtmp_url)

#     def handle_rtmp_url(self, data):
#         self.audio_enabled = False
#         self.rtmp_url = data.strip()
#         self.start_ffmpeg_process()
#         self.send_ack_message("RTMP url received: " + self.rtmp_url)

#     def end_broadcast(self, scope):
#         success = self.transition_broadcast(scope)
#         self.process_manager_cleanup(success)

#     def handle_bytes_data(self, bytes_data):
#         self.process.stdin.write(bytes_data)

#     def cleanup_on_disconnect(self, scope):
#         self.transition_broadcast(scope)
#         cache.delete(f"stream_dict{scope.get('user').id}")
#         self.process_manager_cleanup()

#     def transition_broadcast(self, scope):
#         success = False
#         if self.process:
#             try:
#                 #print("Transitioning broadcast")
#                 stream_dict = cache.get(f"stream_dict{scope.get('user').id}", None)
#                 if stream_dict:
#                     broadcast_status = 'complete'
#                     trans_dict = transition_broadcast(
#                         stream_dict.get('new_broadcast_id'),
#                         broadcast_status,
#                         scope=scope
#                     )
#                     if "error" not in trans_dict:
#                         #print(f"Transitioned broadcast {trans_dict}")
#                         success = True
#                     else:
#                         print(f"Failed to transition broadcast {trans_dict}")

#             except Exception as err:
#                 #print(f"Failed to transition broadcast! >>>>>> {err}")
#                 success = False

#         return success

#     def process_manager_cleanup(self, success=None):
#         if self.process:
#             try:
#                 self.process.stdin.close()
#                 self.process.wait(timeout=5)
#             except subprocess.TimeoutExpired:
#                 #print("Timeout waiting for subprocess to terminate. Forcing termination.")
#                 self.process.terminate()
#             except Exception as e:
#                 print("Error while closing the subprocess: ", e)
#             finally:
#                 self.process = None

#         self.send_ack_message({"message": "Broadcast ended successfully" if success else "Broadcast failed to end"})

#     def start_ffmpeg_process(self):
#         try:
#             command = self.generate_ffmpeg_command()
#             self.process = subprocess.Popen(
#                 command, stdin=subprocess.PIPE,
#                 stdout=subprocess.PIPE,
#                 stderr=subprocess.PIPE,
#                 bufsize=64358,
#             )
#             print(self.process)
#             print(f"FFmpeg process started >>> {self.process.pid}")
#         except Exception as e:
#             print("Error starting FFmpeg process: ", e)

#     def generate_ffmpeg_command(self):
#         print(f'<<<<<<<<<<<<<<<<<<< RTMP URL  {self.rtmp_url} >>>>>>>>>>>>>>> ')
#         command = [
#             'ffmpeg',
#             '-i', '-',
#             '-vcodec', 'copy',
#             '-acodec', 'aac',
#             '-f', 'flv',
#             self.rtmp_url
#         ]

#         if not self.audio_enabled:
#             command = [
#                 'ffmpeg',
#                 '-f', 'lavfi', '-i', 'anullsrc',
#                 '-i', '-',
#                 '-shortest',
#                 '-vcodec', 'copy',
#                 '-acodec', 'aac',
#                 '-f', 'flv',
#                 self.rtmp_url
#             ]

#         return command

#     def extract_rtmp_url(self, data):
#         _, rtmp_url = data.split(",", 1)
#         return rtmp_url.strip()

#     async def send_ack_message(self, message):
#         await self.send({"type": "websocket.send", "text": message})



# XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
# XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
# XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
# XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
# XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
# XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
# XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
# XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX


import os
import subprocess

import django
from channels.consumer import AsyncConsumer
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

    async def websocket_connect(self, event):
        """
        Handle when websocket is connected
            :param event: websocket connection event
            :return: None
        """
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
                self.start_ffmpeg_process()
                await self.send_ack_message("RTMP url received: " + self.rtmpUrl)
            elif 'rtmp://a.rtmp.youtube.com' in data or 'rtmps://a.rtmps.youtube.com' in data:
                self.audio_enabled = False
                self.rtmpUrl = data
                # print("Received RTMP url:", self.rtmpUrl)
                self.start_ffmpeg_process()
                await self.send_ack_message("RTMP url received: " + self.rtmpUrl)
            elif 'ping' in data:
                print('================ pong response recieved ================')
                await self.send_ack_message('pong')

        if 'bytes' in event.keys() and self.process:
            byte_data = event['bytes']
            self.process.stdin.write(byte_data)
            
    async def websocket_disconnect(self, event):
        """when websocket disconnects"""
        self.connection_lost = True

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
        """Common FFmpeg command generation based on audio_enabled flag"""
        command = [
            'ffmpeg',
            '-i', '-',
            '-vcodec', 'copy',
            '-acodec', 'aac',
            '-f', 'flv',
            self.rtmpUrl
        ]

        if not self.audio_enabled:
            # Add additional options if audio is not enabled
            command = [
                'ffmpeg',
                '-f', 'lavfi', '-i', 'anullsrc',
                '-i', '-',
                '-shortest',
                '-vcodec', 'copy',
                '-acodec', 'aac',
                '-f', 'flv',
                self.rtmpUrl
            ]
        print(f'<<<<<<<<<<<<<<<< RTMP URL {self.rtmpUrl} >>>>>>>>>>>>>>>>>')
        return command

    async def send_ack_message(self, message):
        """Send acknowledgement message to frontend"""
        await self.send({"type": "websocket.send", "text": message})