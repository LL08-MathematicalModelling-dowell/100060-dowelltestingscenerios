from channels.consumer import AsyncConsumer
import subprocess


class VideoConsumer(AsyncConsumer):
    async def websocket_connect(self, event):
        # when websocket connects
        print("connected", event)
        print("self", self)
        
        await self.send({ "type": "websocket.accept",})
        
    async def websocket_receive(self, event):
        if 'text' in event.keys():
            data = event['text']
            self.rtmpUrl = data
            command = ['ffmpeg','-i', '-','-acodec', 'aac','-f', 'flv',
            self.rtmpUrl
            ]
            self.process = subprocess.Popen(command, stdin=subprocess.PIPE, stdout=subprocess.PIPE)
            await self.send({
            "type": "websocket.send",
                "text": "rtmpurl received",
            })
        if 'bytes' in event.keys():
            data = event['bytes']
            self.process.stdin.write(event['bytes'])    
            await self.send({
            "type": "websocket.send",
                "text": "bytes received",
            })