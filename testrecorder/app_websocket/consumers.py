import asyncio
import json
from channels.consumer import AsyncConsumer
from random import randint
from time import sleep
import subprocess


class VideoConsumer(AsyncConsumer):

    async def websocket_connect(self, event):
        # when websocket connects
        print("connected", event)

        await self.send({"type": "websocket.accept",
                         })

        """await self.send({"type": "websocket.send",
                         "text": 0})"""

        # rtmp part
        rtmpUrl = 'rtmp://a.rtmp.youtube.com/live2/ep16-03gf-5t9d-f29s-767h'
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
        rtmpUrl 
        ]

        self.process = subprocess.Popen(command, stdin=subprocess.PIPE, stdout=subprocess.PIPE)

    async def websocket_receive(self, event):
        # when messages is received from websocket
        #print("receive", event)
        #print("receive", event['text'])
        #print(event.keys())

        """sleep(1)

        await self.send({"type": "websocket.send",
                         "text": str(randint(0, 100))})"""

        # forward received data to ffmpeg
        self.process.stdin.write(event['bytes'])

    async def websocket_disconnect(self, event):
        # when websocket disconnects
        print("disconnected", event)
        self.process.stdin.close()
