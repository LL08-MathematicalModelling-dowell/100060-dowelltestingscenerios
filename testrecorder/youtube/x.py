import json
from django.core.cache import cache
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials
from .models import YoutubeUserCredential
from datetime import datetime, timedelta


def get_user_cache_key(user_id: int, view_url: str) -> str:
    return f'user_{user_id}_view_{view_url}'


def create_user_youtube_object(request=None, scope=None) -> tuple:
    """
    Create a YouTube object using the v3 version of the API and
    the authenticated user's credentials.
    """
    # #print('Creating youtube object...')
    try:
        if request is not None:
            user = request.user
        elif scope is not None:
            user = scope.get('user')

        try:
            cache_key = get_user_cache_key(
                user.id, 'youtube_credenial_object')
            youtube, credentials = cache.get(cache_key)

            if youtube and credentials:
                return youtube, credentials
        except Exception:
            pass

        # Retrieve the YoutubeUserCredential object associated with the authenticated user
        youtube_user = YoutubeUserCredential.objects.get(user=user)

        # Retrieve the user's credentials associated with the YoutubeUserCredential object
        credentials_data = youtube_user.credential
        try:
            # Convert the JSON string to a dictionary
            credentials_data_dict = json.loads(credentials_data)
            # Create credentials from the dictionary
            credentials = Credentials.from_authorized_user_info(
                info=credentials_data_dict)
        except Exception as e:
            credentials = Credentials.from_authorized_user_info(
                info=credentials_data)
        try:
            # Check if the access token has expired
            if credentials.expired:
                # Import the modules required to refresh the access token
                import google.auth.transport.requests

                # Create a request object using the credentials
                google_request = google.auth.transport.requests.Request()

                # Refresh the access token using the refresh token
                credentials.refresh(google_request)

                # Update the stored credential data with the refreshed token
                youtube_user.credential = credentials.to_json()
                youtube_user.save()
        except Exception as e:
            # Handle any error that occurred while refreshing the access token
            return None, None

        # Create a YouTube object using the v3 version of the API and the retrieved credentials
        youtube = build('youtube', 'v3', credentials=credentials,
                        cache_discovery=False)

        if cache_key:
            # Cache the youtube object
            cache.set(cache_key, (youtube, credentials), 86400)

        return youtube, credentials
    except YoutubeUserCredential.DoesNotExist:
        return None, None


def insert_broadcast(video_privacy_status: str, test_name_value: str, youtube) -> str:
    """
    Creates a liveBroadcast resource and sets its title, scheduled start time,
    scheduled end time, and privacy status.
    """
    time_delta = timedelta(days=0, hours=0, minutes=0, seconds=1)
    time_now = datetime.utcnow()
    future_date_iso = (time_now + time_delta).isoformat()
    video_title = f"{test_name_value} {future_date_iso}"

    try:
        request = youtube.liveBroadcasts().insert(
            part="snippet,contentDetails,statistics,status",
            body={
                "status": {
                    "privacyStatus": video_privacy_status,
                    "selfDeclaredMadeForKids": False
                },
                "snippet": {
                    "scheduledStartTime": future_date_iso,
                    "title": video_title
                },
                "contentDetails": {
                    "enableAutoStart": True,
                    "enableAutoStop": True,
                    "closedCaptionsType": "closedCaptionsEmbedded",
                }
            }
        )

        insert_broadcast_response = request.execute()
        return insert_broadcast_response.get("id", None)

    except Exception as e:
        raise Exception(e.reason)


def insert_stream(youtube) -> dict:
    """
    Creates a new live stream on YouTube and returns information about the stream.
    Args:
        youtube (googleapiclient.discovery.Resource): An initialized YouTube API client.
    Returns:
        dict or None: A dictionary containing information about the new stream if successful,
                     or None if an error occurs.
    """
    try:
        request = youtube.liveStreams().insert(
            part="snippet,cdn,contentDetails,status",
            body={
                "cdn": {
                    "frameRate": "variable",
                    "ingestionType": "rtmp",
                    "resolution": "variable"
                },
                "contentDetails": {
                    "isReusable": False
                },
                "snippet": {
                    "title": "A non-reusable stream",
                    "description": "A stream to be used once."
                }
            }
        )

        insert_stream_response = request.execute()

        snippet = insert_stream_response.get("snippet", {})
        cdn = insert_stream_response.get("cdn", {})
        ingestion_info = cdn.get("ingestionInfo", {})

        new_stream_id = insert_stream_response.get("id", "")
        new_stream_name = ingestion_info.get("streamName", "")
        new_stream_ingestion_address = ingestion_info.get("rtmpsIngestionAddress", "")
        new_rtmp_url = f"{new_stream_ingestion_address}/{new_stream_name}"

        stream_dict = {
            "new_stream_id": new_stream_id,
            "new_stream_name": new_stream_name,
            "new_stream_ingestion_address": new_stream_ingestion_address,
            "new_rtmp_url": new_rtmp_url
        }

        return stream_dict

    except Exception as e:
        raise Exception(e.reason)


def bind_broadcast(youtube, broadcast_id: str, stream_id: str) -> dict:
    """
        Binds the broadcast to the video stream. By doing so, you link the video that
        you will transmit to YouTube to the broadcast that the video is for.
    """
    try:
        request = youtube.liveBroadcasts().bind(
            part="id,status,contentDetails",
            id=broadcast_id,
            streamId=stream_id
        )

        bind_broadcast_response = request.execute()

        return bind_broadcast_response
    except Exception as e:
        raise Exception(e.reason)


def transition_broadcast(broadcast_id: str, status: str, youtube=None, scope=None) -> dict:
    """Handles requests to transition a broadcast to the 'complete' status"""
    if scope:
        youtube, _ = create_user_youtube_object(scope=scope)

    if youtube is None:
            raise Exception('Authentication error')

    try:
        request = youtube.liveBroadcasts().transition(
            broadcastStatus=status,
            id=broadcast_id,
            part="id,status"
        )

        broadcast_transition_response = request.execute()

        if broadcast_transition_response.get('status').get('lifeCycleStatus') == 'complete':
            return broadcast_transition_response
        else:
            return {"error": f"{broadcast_transition_response}"}

    except Exception as e:
        return {'error': e.reason}


def create_broadcast(video_privacy_status: str, test_name_value: str, youtube) -> dict:
    """
    Creates a broadcast with a live stream bound
    """
    stream_dict = {}
    try:
        # Check if the user's account has live streaming enabled
        list_response = youtube.liveBroadcasts().list(
            part='id,snippet,contentDetails,status',
            mine=True
        ).execute()

        if list_response.get('items', [{}]) == [{}]:
            return {'error': 'Live streaming is not enabled for this account'}

        try:
            # Create a new broadcast
            new_broadcast_id = insert_broadcast(video_privacy_status, test_name_value, youtube)
        except Exception as e:
            return {'error': str(e)}

        try:
            # Create a new stream
            stream_dict = insert_stream(youtube)
            # Add the new broadcast id to the stream dictionary
            stream_dict['new_broadcast_id'] = new_broadcast_id
            stream_id = stream_dict.get('new_stream_id')
        except Exception as e:
            return {'error': str(e)}

        try:
            # Bind the stream to the broadcast
            bind_broadcast(youtube, new_broadcast_id, stream_id)
        except Exception as e:
            return {'error': str(e)}
        
        return stream_dict

    except Exception as e:
        return {'error': str(e)}


def insert_video_into_playlist(video_id: str, playlist_id: str, youtube) -> dict:
    """Inserts a video into a YouTube channel playlist"""

    try:
        # Make the insert request
        insert_request_body = {
            "snippet": {
                "playlistId": playlist_id,
                "position": 0,
                "resourceId": {
                    "kind": "youtube#video",
                    "videoId": video_id
                }
            }
        }

        # Insert the video into the playlist using the API's playlistItems.insert method
        request = youtube.playlistItems().insert(
            part="snippet", body=insert_request_body
        )
        response = request.execute()

        return response
    except Exception as e:
        return {'error': (e.reason)}


def start_broadcast(video_privacy_status: str, test_name_value: str, playlist_id: str, youtube) -> dict:
    """ Start recording a video """
    # Create a new broadcast and retrieve the broadcast id
    stream_dict = create_broadcast(
        video_privacy_status, test_name_value, youtube)

    if 'error'  not in stream_dict:
        # Insert the video into the playlist
        video_id = stream_dict.get('new_broadcast_id')

        playlist_insert_response = insert_video_into_playlist(video_id, playlist_id, youtube)

        if 'error' in playlist_insert_response:
            return playlist_insert_response

        return stream_dict
    else:
        return stream_dict




























import os
import subprocess

import django
from channels.consumer import AsyncConsumer
from django.core.cache import cache
from youtube.utils import transition_broadcast

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'testrecorder.settings')
django.setup()


class VideoConsumer(AsyncConsumer):
    """Socket Consumer that accept websocket connection and live stream"""
    def __init__(self):
        self.process_manager = FFmpegProcessManager(send=self.send)

    async def websocket_connect(self, event):
        """Handle when websocket is connected"""
        await self.send({"type": "websocket.accept"})

    async def websocket_receive(self, event):
        """Receive message from WebSocket."""
        if 'text' in event:
            self.process_text_event(event['text'])
        elif 'command' in event:
            await self.process_command_event(event['command'])
        elif 'bytes' in event:
            self.process_bytes_event(event['bytes'])

    async def websocket_disconnect(self, event):
        """Handle when websocket is disconnected"""
        self.process_manager.cleanup_on_disconnect(self.scope)

    def process_text_event(self, text_data):
        """Process the text event"""
        if 'browser_sound' in text_data:
            self.process_manager.handle_browser_sound(text_data)
        elif 'rtmp://a.rtmp.youtube.com' in text_data or 'rtmps://a.rtmps.youtube.com' in text_data:
            self.process_manager.handle_rtmp_url(text_data)

    async def process_command_event(self, command):
        """Process the command event"""
        if command == 'end_broadcast':
            self.process_manager.end_broadcast(self.scope)

    def process_bytes_event(self, bytes_data):
        """Process the bytes event"""
        self.process_manager.handle_bytes_data(bytes_data)


class FFmpegProcessManager:
    """ Manages the FFmpeg process """
    def __init__(self, send=None):
        self.process = None
        self.rtmp_url = None
        self.audio_enabled = False
        self.send = send

    def handle_browser_sound(self, text_data):
        """Handle the browser sound message"""
        self.audio_enabled = True
        self.rtmp_url = self.extract_rtmp_url(text_data)
        self.start_ffmpeg_process()
        self.send_ack_message("RTMP url received: " + self.rtmp_url)

    def handle_rtmp_url(self, data):
        """Handle the rtmp url message"""
        self.audio_enabled = False
        self.rtmp_url = data.strip()
        self.start_ffmpeg_process()
        self.send_ack_message("RTMP url received: " + self.rtmp_url)

    async def end_broadcast(self, scope):
        """Ends the broadcast"""
        success = await self.transition_broadcast(scope=scope)
        self.process_manager_cleanup(success)

    def handle_bytes_data(self, bytes_data):
        """Handle the bytes data message"""
        if self.process:
            self.process.stdin.write(bytes_data)

    def cleanup_on_disconnect(self, scope):
        """Cleanup when the websocket disconnects"""
        if self.process:
            self.transition_broadcast(scope)
            cache.delete(f"stream_dict{scope.get('user').id}")
            self.process_manager_cleanup(websocket_disconnected=True)

    async def transition_broadcast(self, scope):
        """Transition the broadcast"""
        success = False
        if self.process:
            try:
                stream_dict = cache.get(f"stream_dict{scope.get('user').id}", None)
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

    def process_manager_cleanup(self, websocket_disconnected=None, success=None):
        """Cleanup the process manager"""
        try:
            # self.process.stdin.close()
            self.process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            self.process.terminate()
        except Exception as e:
            print("Error while closing the subprocess: ", e)
        finally:
            self.process = None
        if not websocket_disconnected:
            self.send_ack_message({"message": "Broadcast ended successfully" if success else "Broadcast failed to end"})

    def start_ffmpeg_process(self):
        """Start the ffmpeg process"""
        try:
            command = self.generate_ffmpeg_command()
            self.process = subprocess.Popen(
                command, stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                # bufsize=64358,
            )
        except Exception as e:
            print("Error starting FFmpeg process: ", e)

    def generate_ffmpeg_command(self):
        """Generate the ffmpeg command"""
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
        """Extract the rtmp url from the data"""
        _, rtmp_url = data.split(",", 1)
        return rtmp_url.strip()

    async def send_ack_message(self, message):
        """Send acknowledgement message to frontend"""
        await self.send({"type": "websocket.send", "text": message})















