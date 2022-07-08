import asyncio
import json

from blinker import receiver_connected
from channels.consumer import AsyncConsumer
from channels.generic.websocket import AsyncWebsocketConsumer
from random import randint
from time import sleep
import subprocess
from django.conf import settings

class VideoConsumer(AsyncConsumer):

    async def websocket_connect(self, event):
        # when websocket connects
        print("connected", event)
        print("self", self)

        await self.send({"type": "websocket.accept",
                         })


    async def websocket_receive(self, event):
        # when messages is received from websocket
        #print("receive", event)
        #print("receive", event['text'])
        #print(event.keys())

        # check for text key
        if 'text' in event.keys():
            data = event['text']
            print("data: ",data)
            
            # Check there is no audio from browser
            if 'browser_sound' in data:
                new_data = data.split(",")
                print("new_data: ",new_data)
                self.rtmpUrl = new_data[1]
                print("Received RTMP url: ",self.rtmpUrl)
                # rtmp part
                #rtmpUrl = 'rtmp://a.rtmp.youtube.com/live2/ep16-03gf-5t9d-f29s-767h'
                #rtmpUrl = 'rtmp://a.rtmp.youtube.com/live2/gumk-x365-hq2z-mwxp-8dj2'
                fps = 15
                command = ['ffmpeg',
                # Facebook requires an audio track, so we create a silent one here.
                # Remove this line, as well as `-shortest`, if you send audio from the browser.
                #'-f', 'lavfi', '-i', 'anullsrc',
                
                # FFmpeg will read input video from STDIN
                '-i', '-',
                
                # Because we're using a generated audio source which never ends,
                # specify that we'll stop at end of other input.  Remove this line if you
                # send audio from the browser.
                #'-shortest',
                
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

                self.process = subprocess.Popen(command, stdin=subprocess.PIPE, stdout=subprocess.PIPE)

                #Send an acknowledgement for rtmp url received
                msg = "RTMP url received: "+self.rtmpUrl
                await self.send({"type": "websocket.send","text": msg})
            elif 'rtmp://a.rtmp.youtube.com' in data or 'rtmps://a.rtmps.youtube.com' in data:
                # Case where no browser audio is enabled
                self.rtmpUrl = data
                print("Received RTMP url: ",self.rtmpUrl)
                # rtmp part
                #rtmpUrl = 'rtmp://a.rtmp.youtube.com/live2/ep16-03gf-5t9d-f29s-767h'
                #rtmpUrl = 'rtmp://a.rtmp.youtube.com/live2/gumk-x365-hq2z-mwxp-8dj2'
                fps = 15
                command = ['ffmpeg',
                # Facebook requires an audio track, so we create a silent one here.
                # Remove this line, as well as `-shortest`, if you send audio from the browser.
                '-f', 'lavfi', '-i', 'anullsrc',
                
                # FFmpeg will read input video from STDIN
                '-i', '-',
                
                # Because we're using a generated audio source which never ends,
                # specify that we'll stop at end of other input.  Remove this line if you
                # send audio from the browser.
                '-shortest',
                
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

                self.process = subprocess.Popen(command, stdin=subprocess.PIPE, stdout=subprocess.PIPE)

                #Send an acknowledgement for rtmp url received
                msg = "RTMP url received: "+self.rtmpUrl
                await self.send({"type": "websocket.send","text": msg})

        if 'bytes' in event.keys():
            self.process.stdin.write(event['bytes'])

            #Send an acknowledgement for bytes received
            msg = "Bytes received"
            await self.send({"type": "websocket.send","text": msg})


    async def websocket_disconnect(self, event):
        # when websocket disconnects
        print("disconnected", event)
        self.process.stdin.close()


class WebacamScreenVideoConsumer(AsyncConsumer):
    """
        Handles the storage of webcam and screen videos
        into a file.
    """

    async def websocket_connect(self, event):
        # when websocket connects
        #print("connected", event)
        #print("self", self)

        await self.send({"type": "websocket.accept",
                         })

    async def websocket_receive(self, event):
        # when messages is received from websocket
        #print("receive", event)
        #print("receive", event['text'])
        #print(event.keys())

        # check for text key
        if 'text' in event.keys():
            data = event['text']
            print("data: ",data)
            
            # Check there is no audio from browser
            if 'FILENAME,' in data:
                new_data = data.split(",")
                #print("new_data: ",new_data)
                self.recording_file = new_data[1]
                #print("Received Recording File Name: ",self.recording_file)


                #Send an acknowledgement for rtmp url received
                msg = "Received Recording File Name: "+self.recording_file
                await self.send({"type": "websocket.send","text": msg})
            elif 'rtmp://a.rtmp.youtube.com' in data or 'rtmps://a.rtmps.youtube.com' in data:
                # Case where no browser audio is enabled
                self.rtmpUrl = data
                print("Received RTMP url: ",self.rtmpUrl)

                #Send an acknowledgement for rtmp url received
                msg = "RTMP url received: "+self.rtmpUrl
                await self.send({"type": "websocket.send","text": msg})

        if 'bytes' in event.keys():
            # ToDo write data to file
            #self.process.stdin.write(event['bytes'])
            filedata = event['bytes']
            file_name = self.recording_file
            #recording_file_path = settings.MEDIA_ROOT+"/"+file_name
            recording_file_path = settings.TEMP_FILES_ROOT+"/"+file_name
            #print("recording_file_path: ",recording_file_path)

            with open(recording_file_path, 'ab+') as destination:
                #for chunk in filedata.chunks():
                destination.write(filedata)


            #Send an acknowledgement for bytes received
            msg = "Bytes received"
            #print("screen websocket Bytes received")
            await self.send({"type": "websocket.send","text": msg})

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
                'event' : 'connect'
            }
        )

    async def disconnect(self, close_code):
        print("Disconnected: ",close_code)
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
