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


'''
class WebacamScreenVideoConsumer(AsyncConsumer):
    """
        Handles the storage of webcam and screen videos
        into a file.
    """

    async def websocket_connect(self, event):
        # when websocket connects
        # print("connected", event)
        # print("self", self)

        await self.send({"type": "websocket.accept",
                         })

    async def websocket_receive(self, event):
        # when messages is received from websocket
        # print("receive", event)
        # print("receive", event['text'])
        # print(event.keys())

        # check for text key
        if 'text' in event.keys():
            data = event['text']
            print("data: ", data)

            # Check there is no audio from browser
            if 'FILENAME,' in data:
                new_data = data.split(",")
                # print("new_data: ",new_data)
                self.recording_file = new_data[1]
                # print("Received Recording File Name: ",self.recording_file)

                # Send an acknowledgement for rtmp url received
                msg = "Received Recording File Name: "+self.recording_file
                await self.send({"type": "websocket.send", "text": msg})
            elif 'rtmp://a.rtmp.youtube.com' in data or 'rtmps://a.rtmps.youtube.com' in data:
                # Case where no browser audio is enabled
                self.rtmpUrl = data
                print("Received RTMP url: ", self.rtmpUrl)

                # Send an acknowledgement for rtmp url received
                msg = "RTMP url received: "+self.rtmpUrl
                await self.send({"type": "websocket.send", "text": msg})

        if 'bytes' in event.keys():
            # ToDo write data to file
            # self.process.stdin.write(event['bytes'])
            filedata = event['bytes']
            file_name = self.recording_file
            # recording_file_path = settings.MEDIA_ROOT+"/"+file_name
            recording_file_path = settings.TEMP_FILES_ROOT+"/"+file_name
            # print("recording_file_path: ",recording_file_path)

            with open(recording_file_path, 'ab+') as destination:
                # for chunk in filedata.chunks():
                destination.write(filedata)

            # Send an acknowledgement for bytes received
            msg = "Bytes received"
            # print("screen websocket Bytes received")
            await self.send({"type": "websocket.send", "text": msg})

    async def websocket_disconnect(self, event):
        # when websocket disconnects
        print("disconnected", event)


class TaskIdConsumer(AsyncWebsocketConsumer):
    """
        Handles the sending of task ID to browser.
    """

    groups = ['general_group']
    room_group_name = 'notification_group'

    async def connect(self):
        await self.accept()
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.channel_layer.group_send(self.room_group_name,
                                            {
                                                'type': 'send_message',
                                                'event': 'connect'
                                            }
                                            )

    async def disconnect(self, close_code):
        print("Disconnected: ", close_code)
        # Leave room group
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        """
        Receive message from WebSocket.
        Get the event and send the appropriate event
        """
        text_data_json = json.loads(text_data)
        message = text_data_json["message"]

        # Send message to room group
        """await self.channel_layer.group_send(self.room_group_name, {
            'type': 'send_message',
            'rcvd_message': message,
        })"""

    async def send_message(self, res):
        """ Receive message from room group """
        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            "payload": res,
        }))


class MultiPurposeConsumer(AsyncConsumer):
    """
        This websocket can:
            1. Receive video data for storage in a file inside the vps.
            2. Receive video data for sending to youtube.
            3. Receive files data for storing the file inside the vps.
    """

    async def websocket_connect(self, event):
        # when websocket connects
        print("connected", event)
        # print("self", self)

        await self.send({"type": "websocket.accept",
                         })

    async def websocket_receive(self, event):
        try:
            # when messages is received from websocket
            # print("receive", event)
            # print("receive", event['text'])
            # print(event.keys())

            # check for text key
            if 'text' in event.keys():
                data = event['text']
                print("data: ", data)

                json_data = json.loads(data)

                if "message" in json_data.keys():
                    message = json_data["message"]
                    print("message: ", message)

                if "command" in json_data.keys():
                    command = json_data["command"]
                    print("command: ", command)

                    if command == "CREATE_BROADCAST":
                        # set websocket mode
                        self.websocket_mode = json_data["websocketMode"]
                        print("self.websocket_mode: ", self.websocket_mode)

                        # Make API call to create broadcast
                        videoPrivacyStatus = json_data["videoPrivacyStatus"]
                        testNameValue = json_data["testNameValue"]
                        stream_dict = create_broadcast(
                            videoPrivacyStatus, testNameValue)
                        print("stream_dict: ", stream_dict)

                        # for testing
                        # stream_dict = {"newRtmpUrl":"video.mp4", "new_broadcast_id": "video.mp4"}
                        # self.rtmpUrl = "video.mp4"

                        if "newRtmpUrl" in stream_dict.keys():
                            self.rtmpUrl = stream_dict["newRtmpUrl"].replace(
                                "rtmps", "rtmp")
                            print("self.rtmpUrl: ", self.rtmpUrl)
                            self.new_broadcast_id = stream_dict["new_broadcast_id"]
                            # self.rtmpUrl = 'rtmp://a.rtmp.youtube.com/live2/zuj6-w4v7-43cy-9b6s-7x2y'
                            # self.rtmpUrl = "video.mp4"

                            fps = 15
                            command = ['ffmpeg',
                                       # Facebook requires an audio track, so we create a silent one here.
                                       # Remove this line, as well as `-shortest`, if you send audio from the browser.
                                       # '-f', 'lavfi', '-i', 'anullsrc',

                                       # FFmpeg will read input video from STDIN
                                       '-i', '-',

                                       # Because we're using a generated audio source which never ends,
                                       # specify that we'll stop at end of other input.  Remove this line if you
                                       # send audio from the browser.
                                       # '-shortest',

                                       # If we're encoding H.264 in-browser, we can set the video codec to 'copy'
                                       # so that we don't waste any CPU and quality with unnecessary transcoding.
                                       # If the browser doesn't support H.264, set the video codec to 'libx264'
                                       # or similar to transcode it to H.264 here on the server.
                                       # '-vcodec', 'libx264',
                                       '-vcodec', 'copy',

                                       # AAC audio is required for Facebook Live.  No browser currently supports
                                       # encoding AAC, so we must transcode the audio to AAC here on the server.
                                       '-acodec', 'aac',

                                       # FLV is the container format used in conjunction with RTMP
                                       '-f', 'flv',

                                       # The output RTMP URL.
                                       # For debugging, you could set this to a filename like 'test.flv', and play
                                       # the resulting file with VLC.
                                       self.rtmpUrl
                                       ]

                            self.process = subprocess.Popen(
                                command, stdin=subprocess.PIPE, stdout=subprocess.PIPE)

                            # Send an acknowledgement
                            msg = {
                                "FEED_BACK": "Broadcast created",
                                "broadcast_data": stream_dict
                            }
                            json_msg = json.dumps(msg)
                            print(json_msg)
                            await self.send({"type": "websocket.send", "text": json_msg})

                        else:
                            # Send an acknowledgement
                            msg = {"FEED_BACK": "Failed to create broadcast!"}
                            json_msg = json.dumps(msg)
                            print(json_msg)
                            await self.send({"type": "websocket.send", "text": json_msg})

                    elif command == "END_BROADCAST":
                        # transition broadcast to complete status
                        try:
                            response = transition_broadcast(
                                self.new_broadcast_id)
                            print("transition_broadcast response: ", response)
                        except Exception as err:
                            print("Failed to transition broadcast!")

                        # close ffmpeg
                        try:
                            self.process.stdin.close()
                        except Exception as err:
                            print("Failed to close ffmpeg!")

                        # save recording metadata
                        response = save_recording_metadata(json_data)
                        print("transition_broadcast response: ", response)

                        # Send an acknowledgement
                        if "file_links" in response.keys():
                            msg = {"FEED_BACK": "Recording metadata saved",
                                   "file_links": response["file_links"]
                                   }
                        else:
                            msg = {"FEED_BACK": "Failed to save recording metadata",
                                   "metadata_save_failure": response
                                   }

                        json_msg = json.dumps(msg)
                        print(json_msg)
                        await self.send({"type": "websocket.send", "text": json_msg})

                    elif command == "STORE_VIDEO_ON_VPS":
                        # set websocket mode
                        self.websocket_mode = json_data["websocketMode"]
                        print("self.websocket_mode: ", self.websocket_mode)

                        # set video file name
                        video_file_name = json_data["videoFileName"]
                        self.rtmpUrl = settings.TEMP_FILES_ROOT+"/"+video_file_name

                        """# Initialize ffmpeg
                        command = ['ffmpeg',
                                   # Facebook requires an audio track, so we create a silent one here.
                                   # Remove this line, as well as `-shortest`, if you send audio from the browser.
                                   # '-f', 'lavfi', '-i', 'anullsrc',

                                   # FFmpeg will read input video from STDIN
                                   '-i', '-',

                                   # Because we're using a generated audio source which never ends,
                                   # specify that we'll stop at end of other input.  Remove this line if you
                                   # send audio from the browser.
                                   # '-shortest',

                                   # If we're encoding H.264 in-browser, we can set the video codec to 'copy'
                                   # so that we don't waste any CPU and quality with unnecessary transcoding.
                                   # If the browser doesn't support H.264, set the video codec to 'libx264'
                                   # or similar to transcode it to H.264 here on the server.
                                   '-vcodec', 'copy',

                                   # AAC audio is required for Facebook Live.  No browser currently supports
                                   # encoding AAC, so we must transcode the audio to AAC here on the server.
                                   '-acodec', 'aac',

                                   # FLV is the container format used in conjunction with RTMP
                                   '-f', 'flv',

                                   # The output RTMP URL.
                                   # For debugging, you could set this to a filename like 'test.flv', and play
                                   # the resulting file with VLC.
                                   self.rtmpUrl
                                   ]

                        self.process = subprocess.Popen(
                            command, stdin=subprocess.PIPE, stdout=subprocess.PIPE)"""

                        # Send an acknowledgement
                        msg = {"FEED_BACK": "Video File Name was set"}
                        json_msg = json.dumps(msg)
                        print(json_msg)
                        await self.send({"type": "websocket.send", "text": json_msg})

                    elif command == "STORE_FILE_ON_VPS":
                        # set websocket mode
                        self.websocket_mode = json_data["websocketMode"]
                        print("self.websocket_mode: ", self.websocket_mode)

                        # set video file name
                        upload_file_name = json_data["FileName"]
                        print("upload_file_name: ", upload_file_name)
                        # self.rtmpUrl = settings.TEMP_FILES_ROOT+"/"+video_file_name
                        # self.rtmpUrl = settings.TEMP_FILES_ROOT+"/"+upload_file_name
                        self.upload_file_name = settings.TEMP_FILES_ROOT+"/"+upload_file_name

                        # Send an acknowledgement
                        msg = {"FEED_BACK": "Upload File Name was set"}
                        json_msg = json.dumps(msg)
                        print(json_msg)
                        await self.send({"type": "websocket.send", "text": json_msg})

                    # elif command == "FETCH_PLAYLISTS":
                    #     playlists_data = fetch_user_playlists()
                    #     #print("fetching playlists")

                    #     # Send an acknowledgement
                    #     msg = {
                    #         "FEED_BACK": "Playlists were fetched",
                    #         "playlists_data": playlists_data
                    #     }
                    #     json_msg = json.dumps(msg)
                    #     print(json_msg)
                    #     await self.send({"type": "websocket.send", "text": json_msg})

                    elif command == "INSERT_VIDEO_IN_PLAYLIST":
                        # print("Inserting video into playlist")
                        the_video_id = json_data["videoId"]
                        # print("the_video_id: ",the_video_id)
                        the_playlist_id = json_data["playlistId"]
                        # print("the_playlist_id: ",the_playlist_id)
                        response = insert_video_into_playlist(
                            the_video_id, the_playlist_id)

                        # Send an acknowledgement
                        msg = {
                            "FEED_BACK": "Video insertion into playlist",
                            "video_playlist_insert_status": response
                        }
                        json_msg = json.dumps(msg)
                        print(json_msg)
                        await self.send({"type": "websocket.send", "text": json_msg})

            if 'bytes' in event.keys():
                # Send video bytes to youtube
                if self.websocket_mode == "youtube":
                    self.process.stdin.write(event['bytes'])
                    # Send an acknowledgement for bytes received
                    # msg = "Bytes received"
                    msg = {"message": "Bytes received"}
                    json_msg = json.dumps(msg)
                    await self.send({"type": "websocket.send", "text": json_msg})

                # ToDo write data to file
                if self.websocket_mode == "vps video":
                    # self.process.stdin.write(event['bytes'])
                    filedata = event['bytes']
                    recording_file_path = self.rtmpUrl
                    # print("recording_file_path: ",recording_file_path)

                    with open(recording_file_path, 'ab+') as destination:
                        destination.write(filedata)

                    # Send an acknowledgement for bytes received
                    # msg = "Bytes received"
                    msg = {"message": "Bytes received"}
                    json_msg = json.dumps(msg)
                    await self.send({"type": "websocket.send", "text": json_msg})

                # save keylog file
                if self.websocket_mode == "vps file":
                    keylog_filedata = event['bytes']
                    # keylog_recording_file_path = "beanote.txt"
                    keylog_recording_file_path = self.upload_file_name
                    print("keylog_recording_file_path: ",
                          keylog_recording_file_path)
                    with open(keylog_recording_file_path, 'wb+') as destination:
                        destination.write(keylog_filedata)

                    # Send an acknowledgement for bytes received
                    # msg = "Bytes received"
                    msg = {"FEED_BACK": "Upload file was saved"}
                    json_msg = json.dumps(msg)
                    await self.send({"type": "websocket.send", "text": json_msg})

        except Exception as err:
            error_msg = "Error while handling Received websocket message: " + \
                str(err)
            print(error_msg)
            msg = {"error_message": error_msg}
            json_msg = json.dumps(msg)
            await self.send({"type": "websocket.send", "text": json_msg})

    async def websocket_disconnect(self, event):
        # when websocket disconnects
        print("disconnected", event)
        try:
            self.process.stdin.close()
        except Exception as err:
            print("Failed to close ffmpeg")

'''
