import os
import json
import logging
from datetime import datetime, timedelta
from django.core.cache import cache
from django.http import HttpResponse
from django.shortcuts import redirect
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from rest_framework.renderers import JSONRenderer
from googleapiclient.errors import HttpError
from django.contrib.auth import logout
import pymongo

from .utils import create_user_youtube_object, get_user_cache_key



logger = logging.getLogger(__name__)


def index(request):
    return HttpResponse(print_index_table())


def insert_broadcast(youtube):
    """
        Creates a liveBroadcast resource and set its title, scheduled start time,
        scheduled end time, and privacy status.
    """
    # create broadcast time
    time_delt1 = timedelta(days=0, hours=0, minutes=5)  # ToDo use milliseconds
    # time_now = datetime.now()
    time_now = datetime.utcnow()
    future_date1 = time_now + time_delt1
    future_date_iso = future_date1.isoformat()
    videoPrivacyStatus = "private"  # ToDo get this from request
    testNameValue = "Python tests"  # ToDo get this from request
    videoTitle = "Test Record Broadcast " + testNameValue + " " + future_date_iso
   # print(future_date_iso)

    request = youtube.liveBroadcasts().insert(
        part="snippet,contentDetails,statistics,status",
        body={
            "status": {
                "privacyStatus": videoPrivacyStatus,
                "selfDeclaredMadeForKids": False
            },
            "snippet": {
                "scheduledStartTime": future_date_iso,
                "title": videoTitle
            },
            "contentDetails": {
                "enableAutoStart": True,
                "enableAutoStop": True,
                "closedCaptionsType": "closedCaptionsEmbedded",
            }
        }
    )
    insert_broadcast_response = request.execute()

    return insert_broadcast_response["id"]


def insert_stream(youtube):
    """
        Creates a liveStream resource and set its title, format, and ingestion type.
        This resource describes the content that you are transmitting to YouTube.
    """
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
                "title": "A non reusable stream",
                "description": "A stream to be used once."
            }
        }
    )

    insert_stream_response = request.execute()
    snippet = insert_stream_response["snippet"]
    cdn = insert_stream_response["cdn"]
    ingestionInfo = cdn["ingestionInfo"]
    newStreamId = insert_stream_response["id"]
    newStreamName = ingestionInfo["streamName"]
    newStreamIngestionAddress = ingestionInfo["rtmpsIngestionAddress"]
    newRtmpUrl = newStreamIngestionAddress + "/" + newStreamName
    stream_dict = {"newStreamId": newStreamId,
                   "newStreamName": newStreamName,
                   "newStreamIngestionAddress": newStreamIngestionAddress,
                   "newRtmpUrl": newRtmpUrl
                   }
    return stream_dict


def bind_broadcast(youtube, broadcast_id, stream_id):
    """
        Binds the broadcast to the video stream. By doing so, you link the video that
        you will transmit to YouTube to the broadcast that the video is for.
    """
    request = youtube.liveBroadcasts().bind(
        part="id,contentDetails",
        id=broadcast_id,
        streamId=stream_id
    )

    bind_broadcast_response = request.execute()
    return bind_broadcast_response


def create_broadcast(request):
    """
        Creates a broadcast, it is view based.
    """
    youtube, credential = create_user_youtube_object(request)
    if youtube is None:
        return Response({'Error': 'Account is not a Google account'}, status=status.HTTP_401_UNAUTHORIZED)

    # create broadcast time
    time_delt1 = timedelta(days=0, hours=0, minutes=5)
    time_now = datetime.utcnow()
    future_date1 = time_now + time_delt1
    future_date_iso = future_date1.isoformat()

    # Create broadcast
    new_broadcast_id = insert_broadcast(youtube)

    # Create stream
    stream_dict = insert_stream(youtube)

    # Bind livestream and broadcast
    stream_dict['new_broadcast_id'] = new_broadcast_id
    stream_id = stream_dict['newStreamId']
    bind_broadcast(youtube, new_broadcast_id, stream_id)

    # Serializing json
    json_stream_dict = json.dumps(stream_dict)

    # return json_stream_dict
    return HttpResponse(json_stream_dict)


def credentials_to_dict(credentials):
    return {'token': credentials.token,
            'refresh_token': credentials.refresh_token,
            'token_uri': credentials.token_uri,
            'client_id': credentials.client_id,
            'client_secret': credentials.client_secret,
            'scopes': credentials.scopes}


def print_index_table():
    return ('<table>' +
            '<tr><td><a href="/youtube/test">Test an API request</a></td>' +
            '<td>Submit an API request and see a formatted JSON response. ' +
            '    Go through the authorization flow if there are no stored ' +
            '    credentials for the user.</td></tr>' +
            '<tr><td><a href="/youtube/authorize">Test the auth flow directly</a></td>' +
            '<td>Go directly to the authorization flow. If there are stored ' +
            '    credentials, you still might not be prompted to reauthorize ' +
            '    the application.</td></tr>' +
            '<tr><td><a href="/youtube/revoke">Revoke current credentials</a></td>' +
            '<td>Revoke the access token associated with the current user ' +
            '    session. After revoking credentials, if you go to the test ' +
            '    page, you should see an <code>invalid_grant</code> error.' +
            '</td></tr>' +
            '<tr><td><a href="/youtube/clear">Clear App session credentials</a></td>' +
            '<td>Clear the access token currently stored in the user session. ' +
            '    After clearing the token, if you <a href="/test">test the ' +
            '    API request</a> again, you should go back to the auth flow.' +
            '</td></tr></table>')


def insert_broadcast(youtube, video_privacy_status, test_name_value):
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
        snippet = insert_broadcast_response.get("snippet", {})

        return insert_broadcast_response.get("id", "")

    except Exception as e:
        return None

def insert_stream(youtube):
    """
    Creates a liveStream resource and sets its title, format, and ingestion type.
    This resource describes the content that you are transmitting to YouTube.
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
            "newStreamId": new_stream_id,
            "newStreamName": new_stream_name,
            "newStreamIngestionAddress": new_stream_ingestion_address,
            "newRtmpUrl": new_rtmp_url
        }

        return stream_dict

    except HttpError as e:
        return None

    except Exception as e:
        return None

class CreateBroadcastView(APIView):
    renderer_classes = [JSONRenderer]

    def post(self, request, *args, **kwargs):
        """
        Creates a broadcast using the API
        """
        video_privacy_status = request.data.get("videoPrivacyStatus")
        test_name_value = request.data.get("testNameValue")
        
        try:
            stream_dict = self.create_broadcast(video_privacy_status, test_name_value, request)
        except HttpError as e:
            error_data = {'message': e.reason}
            return Response(error_data, status=status.HTTP_403_FORBIDDEN)
        
        return Response(stream_dict, status=status.HTTP_201_CREATED)

    def create_broadcast(self, video_privacy_status, test_name_value, request):
        """
        Creates a broadcast with a live stream bound
        """
        # Get the user's YouTube object
        youtube, credential = create_user_youtube_object(request)
        if youtube is None:
            raise Exception('Authentication error')

        try:
            # Check if the user's account has live streaming enabled
            list_response = youtube.liveBroadcasts().list(
                part='id,snippet,contentDetails,status',
                mine=True
            ).execute()

            channel_id = list_response.get('items', [{}])[0].get('snippet', {}).get('channelId')
            if not channel_id:
                logger.critical('User does not have a YouTube channel!!!')
                raise Exception("User does not have a YouTube channel")
        
            # Create a new broadcast
            new_broadcast_id = insert_broadcast(youtube, video_privacy_status, test_name_value)

            # Create a new stream
            stream_dict = insert_stream(youtube)

            if stream_dict is None:
                raise Exception("Failed to create stream")
            # Bind the stream to the broadcast
            stream_dict['new_broadcast_id'] = new_broadcast_id
            stream_id = stream_dict.get('newStreamId')
            bind_broadcast(youtube, new_broadcast_id, stream_id)

            return stream_dict
        
        except Exception as e:
            logger.error(f"Error: {e}")
            raise Exception('Failed to create broadcast')


class TransitionBroadcastView(APIView):
    renderer_classes = [JSONRenderer]

    def post(self, request, *args, **kwargs):
        try:
            the_broadcast_id = request.data.get("the_broadcast_id")
            transition_response = self.transition_broadcast(the_broadcast_id, request)
            return Response(transition_response, status=status.HTTP_200_OK)
        except HttpError as e:
            error = {'Error': f'YouTube API error: {e}'}
            return Response(error, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            error = {'Error': f'An unexpected error occurred: {e}'}
            return Response(error, status=status.HTTP_400_BAD_REQUEST)

    def transition_broadcast(self, the_broadcast_id, request):
        """Handles requests to transition a broadcast to the 'complete' status"""
        youtube, credential = create_user_youtube_object(request)
        if youtube is None:
            raise Exception('Authentication error')

        try:
            request = youtube.liveBroadcasts().transition(
                broadcastStatus="complete",
                id=the_broadcast_id,
                part="id,snippet,contentDetails,status"
            )

            broadcast_transition_response = request.execute()
            video_id = broadcast_transition_response.get('id', None)

            if video_id:
                return broadcast_transition_response
            else:
                raise Exception("Transition broadcast response did not contain a valid video ID")
        except HttpError as e:
            raise HttpError(e.resp, e.content)
        except Exception as e:
            raise e


class PlaylistItemsInsertView(APIView):
    """
    Handles requests to insert a video into a YouTube channel playlist
    """
    renderer_classes = [JSONRenderer]

    def post(self, request, *args, **kwargs):
        """Inserts a video into a YouTube channel playlist"""
        try:
            # Get the video and playlist data
            the_video_id = request.data.get("videoId")
            the_playlist_id = request.data.get("playlistId")

            youtube, credential = create_user_youtube_object(request)
            if youtube is None:
                raise Exception('Authentication error')

            # Make the insert request
            insert_request_body = {
                "snippet": {
                    "playlistId": the_playlist_id,
                    "position": 0,
                    "resourceId": {
                        "kind": "youtube#video",
                        "videoId": the_video_id
                    }
                }
            }

            request = youtube.playlistItems().insert(part="snippet", body=insert_request_body)
            response = request.execute()

            return Response(response, status=status.HTTP_200_OK)

        except HttpError as e:
            error_data = {'Error': f'YouTube API error: {e}'}
            print(f'xxxxxxxxxxxxxxxxxxxxxx playlist insert error:  {error_data} ')
            return Response(error_data, status=status.HTTP_400_BAD_REQUEST)

        except Exception as err:
            error_data = {'Error': f'An unexpected error occurred: {err}'}
            print(f'xxxxxxxxxxxxxxxxxxxxxx playlist insert error:  {error_data} ')
            return Response(error_data, status=status.HTTP_400_BAD_REQUEST)


# def get_todays_playlist_title():
#     """
#         Creates the title of current day's playlist.
#     """
#     # Construct playlist title using date
#     current_date_and_time = datetime.now()
#     date_string = current_date_and_time.strftime('%d %B %Y')
#     playlist_title = date_string + " Daily Playlist"

#     return playlist_title


def fetch_playlists_with_pagination(youtube_object):
    """
    Fetches playlists with the help of pagination
    :param youtube_object: Object for accessing YouTube API
    :return: List of fetched playlists
    """
    fetch_playlists = True
    playlists = []
    page_token = ""

    while fetch_playlists:
        request = youtube_object.playlists().list(
            part="snippet,contentDetails",
            maxResults=50,
            mine=True,
            pageToken=page_token
        )
        response = request.execute()

        if "nextPageToken" in response:
            page_token = response['nextPageToken']
        else:
            fetch_playlists = False

        playlists.extend(response['items'])
    return playlists

# Created the function to be used by FetchPlaylistsView and CreatePlaylistView.
# CreatePlaylistView uses it to reset the cache after add a new playlist.
# FetchPlaylistsView uses it to fetch playlists if not found in cache.
def fetch_and_add_playlist_to_cache(request, cache_key):

    # Get the user's youtube object
    youtube, credential = create_user_youtube_object(request)
    if youtube is None:
        return Response({'Error': 'Authentication error'}, status=status.HTTP_401_UNAUTHORIZED)

    # Get the playlists
    playlists = fetch_playlists_with_pagination(youtube)

    # Check if the playlist is empty
    if not playlists:
        return Response({'Error': 'The playlist is empty.'}, status=status.HTTP_204_NO_CONTENT)

    user_playlists = {}
    todays_playlist_dict = {}
    channel_title = ""

    for playlist in playlists:
        playlist_id = playlist["id"]
        title = playlist["snippet"]["title"]

        if "Daily Playlist" not in title:
            user_playlists[playlist_id] = title

        channel_title = playlist["snippet"]["channelTitle"]

    youtube_details = {
        'channel_title': channel_title,
        'user_playlists': user_playlists,
        'todays_playlist_dict': todays_playlist_dict
    }

    # Cache the response, expires in 6 hours
    cache.set(cache_key, youtube_details, 6 * 60 * 60)
    return youtube_details

class FetchPlaylistsView(APIView):
    """
    Handles requests to get the current YouTube channel's playlists
    """

    renderer_classes = [JSONRenderer]

    def get(self, request, *args, **kwargs):
        try:
            # Get the user object
            user = request.user

            # Check the cache for the user's playlists
            cache_key = get_user_cache_key(user.id, '/fetchplaylists/api/')
            cached_response = cache.get(cache_key, None)

            # # Return the cached response if it exists
            if cached_response is not None:
                return Response(cached_response, status=status.HTTP_200_OK)

            youtube_details = fetch_and_add_playlist_to_cache(request, cache_key)

            return Response(youtube_details, status=status.HTTP_200_OK)

        except Exception as err:
            return Response({'Error': 'Error occured, unable to fetch playlist'}, status=status.HTTP_400_BAD_REQUEST)


def insert_video_into_playlist(request, the_video_id, the_playlist_id):
    """
        Handles requests to insert a video into a youtube channel
        playlist
    """
    try:
        youtube, credential = create_user_youtube_object(request)

        if youtube is None:
            return Response({'Error': 'Account is not a Google account'}, status=status.HTTP_401_UNAUTHORIZED)

        # Make the insert request
        request = youtube.playlistItems().insert(
            part="snippet",
            body={
                "snippet": {
                    "playlistId": the_playlist_id,
                    "position": 0,
                    "resourceId": {
                        "kind": "youtube#video",
                        "videoId": the_video_id
                    }
                }
            }
        )
        response = request.execute()

        return True

    except Exception as err:
        error_msg = "Error while inserting video into playlist: " + str(err)
        raise Exception(error_msg)


def create_playlist(playlist_title, playlist_description, playlist_privacy_status, request):
    """
    Handles requests to create a playlist
    """
    try:
        youtube, credential = create_user_youtube_object(request)
        if youtube is None:
            return Response({'Error': 'Account is not a Google account'}, status=status.HTTP_401_UNAUTHORIZED)

        # Check if a playlist with provided title exists
        playlists = fetch_playlists_with_pagination(youtube)
        for playlist in playlists:
            title = playlist["snippet"]["title"]
            if playlist_title.lower() == title.lower():
                raise Exception(
                    f"A playlist with the title '{playlist_title}' already exists!")

        # Make the insert request
        request = youtube.playlists().insert(
            part="snippet,status",
            body={
                "snippet": {
                    "title": playlist_title,
                    "description": playlist_description,
                    "tags": ["sample playlist", "API call"],
                    "defaultLanguage": "en"
                },
                "status": {"privacyStatus": playlist_privacy_status}
            }
        )
        response = request.execute()
        return response

    except HttpError as err:
        error_msg = f"HTTP error occurred while creating playlist: {err}"
        raise Exception(error_msg)

    except Exception as err:
        error_msg = f"Error occurred while creating playlist: {err}"
        raise Exception(error_msg)


class CreatePlaylistView(APIView):
    """
        DRF API that handles requests to create youtube playlists
    """

    renderer_classes = [JSONRenderer]

    def post(self, request, *args, **kwargs):
        try:
            # Get the new playlist information
            title = request.data.get("new_playlist_title")
            description = request.data.get("new_playlist_description")
            privacy = request.data.get("new_playlist_privacy")

            # Check if playlist already exists

            # create playlist
            response = create_playlist(title, description, privacy, request)
            if response:
                # Get the user object
                user = request.user

                # Fetch and add new playlists to cache.
                cache_key = get_user_cache_key(user.id, '/fetchplaylists/api/')
                fetch_and_add_playlist_to_cache(request, cache_key)

                msg = {'CreatePlaylistResponse': "Playlist created"}
                return Response(msg, status=status.HTTP_200_OK)
            else:
                msg = {'CreatePlaylistResponse': "Failed to create playlist"}
                return Response(msg, status=status.HTTP_400_BAD_REQUEST)

        except Exception as err:
            error_msg = "Error while creating playlist: " + str(err)
            print("Error Message", error_msg)

            if "already exists!" in error_msg:
                return Response(error_msg, status=status.HTTP_409_CONFLICT)
            else:
                return Response(error_msg, status=status.HTTP_400_BAD_REQUEST)


def logout_view(request):
    '''Logs a user out and redirect to the homepage'''
    logout(request)
    return redirect('/')
