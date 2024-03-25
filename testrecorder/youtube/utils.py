import json
from datetime import datetime, timedelta
from django.core.cache import cache
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials
from googleapiclient.http import MediaFileUpload
from .models import UserProfile


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

        # Retrieve the UserProfile object associated with the authenticated user
        youtube_user = UserProfile.objects.get(user=user)

        # Retrieve the user's credentials associated with the UserProfile object
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
    except UserProfile.DoesNotExist:
        return None, None


def upload_video_to_playlist(youtube, video_path, title, description, tags, playlist_id, privacy_status='private'):
    """
    Uploads a video to YouTube and adds it to a playlist.

    Parameters:
        - video_path (str): Path to the video file to be uploaded.
        - title (str): Title of the video.
        - description (str): Description of the video.
        - tags (list): List of tags for the video.
        - playlist_id (str): ID of the playlist to add the video to.
        - privacy_status (str, optional): Privacy status of the video (default is 'private').

    Returns:
        - str: Video ID of the uploaded video.
    """

    # Define the parameters for the video upload
    request_body = {
        'snippet': {
            'title': title,
            'description': description,
            'tags': tags,
            'categoryId': '22',  # category IDs in YouTube API documentation
            'playlistId': playlist_id
        },
        'status': {
            'privacyStatus': privacy_status,
        }
    }

    # Specify the video file to upload
    media = MediaFileUpload(video_path)

    # Execute the API request to upload the video
    response = youtube.videos().insert(
        part='snippet,status',
        body=request_body,
        media_body=media
    ).execute()

    # Add the video to the playlist
    youtube.playlistItems().insert(
        part='snippet',
        body={
            'snippet': {
                'playlistId': playlist_id,
                'resourceId': {
                    'kind': 'youtube#video',
                    'videoId': response['id']
                }
            }
        }
    ).execute()

    return response['id']


def insert_broadcast(video_privacy_status: str, test_name_value: str, youtube, scheduled_start_time: datetime = None) -> dict:
    """
    Creates a liveBroadcast resource and sets its title, scheduled start time,
    scheduled end time, and privacy status.
    """
    if scheduled_start_time is None:
        time_delta = timedelta(days=0, hours=0, minutes=0, seconds=1)
        time_now = datetime.utcnow()
        scheduled_start_time = (time_now + time_delta).isoformat()

    video_title = f"{test_name_value} {scheduled_start_time}"

    try:
        request = youtube.liveBroadcasts().insert(
            part="snippet,contentDetails,statistics,status",
            body={
                "status": {
                    "privacyStatus": video_privacy_status,
                    "selfDeclaredMadeForKids": False
                },
                "snippet": {
                    "scheduledStartTime": scheduled_start_time,
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
        return (
            insert_broadcast_response.get("id", None),
            insert_broadcast_response.get("snippet", None).get("scheduledStartTime", None)
        )

    except Exception as e:
        raise Exception(e)

    except Exception as e:
        raise Exception(e)


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
        new_stream_ingestion_address = ingestion_info.get(
            'ingestionAddress'
        )  # ("rtmpsIngestionAddress", "")
        new_rtmp_url = f"{new_stream_ingestion_address}/{new_stream_name}"

        stream_dict = {
            "new_stream_id": new_stream_id,
            "new_stream_name": new_stream_name,
            "new_stream_ingestion_address": new_stream_ingestion_address,
            "new_rtmp_url": new_rtmp_url
        }

        return stream_dict

    except Exception as e:
        raise Exception(str(e))


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
        raise Exception(str(e))


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
        return {'error': str(e)}


def create_broadcast(video_privacy_status: str, test_name_value: str, youtube, scheduled_start_time: datetime = None) -> dict:
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
            broadcast_id, scheduled_start_time = insert_broadcast(
                video_privacy_status, test_name_value, youtube, scheduled_start_time=None)
        except Exception as e:
            return {'error': str(e)}

        try:
            # Create a new stream
            stream_dict = insert_stream(youtube)
            # Add the new broadcast id to the stream dictionary
            stream_dict['new_broadcast_id'] = broadcast_id
            stream_dict['scheduled_start_time'] = scheduled_start_time
            stream_id = stream_dict.get('new_stream_id')
        except Exception as e:
            return {'error': str(e)}

        try:
            # Bind the stream to the broadcast
            bind_broadcast(youtube, broadcast_id, stream_id)
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
        return {'error': str(e)}


def start_broadcast(video_privacy_status: str, test_name_value: str, playlist_id: str, youtube, scheduled_start_time: datetime = None) -> dict:
    """ Start recording a video """
    # Create a new broadcast and retrieve the broadcast id
    stream_dict = create_broadcast(
        video_privacy_status, test_name_value, youtube, scheduled_start_time)

    if 'error' not in stream_dict:
        # Insert the video into the playlist
        video_id = stream_dict.get('new_broadcast_id')

        playlist_insert_response = insert_video_into_playlist(
            video_id, playlist_id, youtube)

        if 'error' in playlist_insert_response:
            return playlist_insert_response

        return stream_dict
    else:
        return stream_dict
