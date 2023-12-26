import logging
from django.core.cache import cache
from django.shortcuts import redirect
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from rest_framework.renderers import JSONRenderer
from googleapiclient.errors import HttpError
from django.contrib.auth import logout
from rest_framework.decorators import authentication_classes



from core.auth import GoogleAPIKeyAuthentication
from .serializers import (
    StartBroadcastSerializer,
    TransitionBroadcastSerializer,
    CreatePlaylistSerializer
)
from .utils import (
    create_user_youtube_object,
    get_user_cache_key,
    start_broadcast,
    transition_broadcast,
)


logger = logging.getLogger(__name__)

@authentication_classes([GoogleAPIKeyAuthentication])
class StartBroadcastView(APIView):
    """ DRF API that handles requests to start a broadcast """
    serializer_class = StartBroadcastSerializer

    def post(self, request, *args, **kwargs):
        """
        Creates a broadcast using the API
        """
        serializer = self.serializer_class(data=request.data)
        if serializer.is_valid(raise_exception=True):
            video_privacy_status = serializer.validated_data["video_privacy"]
            test_name_value = serializer.validated_data["video_title"]
            playlist_id = serializer.validated_data["playlist_id"]

            youtube, _ = create_user_youtube_object(request=request)

            if youtube is None:
                return Response({'Error': 'Account is not a Google account'}, status=status.HTTP_401_UNAUTHORIZED)

            stream_dict = start_broadcast(video_privacy_status, test_name_value, playlist_id, youtube)

            if "error" in stream_dict:
                return Response(stream_dict, status=status.HTTP_400_BAD_REQUEST)

            # Cache the stream dictionary, manually deleted in the consumer after transitioning
            cache.set(f'stream_dict{request.user.id}', stream_dict, 6 * 60 * 60)

            return Response(stream_dict, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@authentication_classes([GoogleAPIKeyAuthentication])
class TransitionBroadcastView(APIView):
    """ DRF API that handles requests to transition a broadcast """
    serializer_class = TransitionBroadcastSerializer

    def post(self, request, *args, **kwargs):
        """Transitions a broadcast using the API"""
        serializer = self.serializer_class(data=request.data)
        if serializer.is_valid(raise_exception=True):
            broadcast_id = serializer.validated_data["broadcast_id"]
            broadcast_status = serializer.validated_data["broadcast_status"]

            youtube, _ = create_user_youtube_object(request=request)

            if youtube is None:
                return Response({'Error': 'Account is not a Google account'}, status=status.HTTP_401_UNAUTHORIZED)

            transition_dict = transition_broadcast(broadcast_id, broadcast_status, youtube=youtube)
            if "error" in transition_dict:
                return Response(transition_dict, status=status.HTTP_400_BAD_REQUEST)

            return Response(transition_dict, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


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


@authentication_classes([GoogleAPIKeyAuthentication])
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

            # Return the cached response if it exists
            if cached_response is not None:
                return Response(cached_response, status=status.HTTP_200_OK)

            # Get the user's youtube object
            youtube, _ = create_user_youtube_object(request=request)
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

            return Response(youtube_details, status=status.HTTP_200_OK)

        except Exception as err:
            return Response({'Error': 'Error occured, unable to fetch playlist'}, status=status.HTTP_400_BAD_REQUEST)


def create_playlist(playlist_title, playlist_description, playlist_privacy_status, request):
    """
    Handles requests to create a playlist
    """
    try:
        youtube, _ = create_user_youtube_object(request=request)
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


@authentication_classes([GoogleAPIKeyAuthentication])
class CreatePlaylistView(APIView):
    """
        DRF API that handles requests to create youtube playlists
    """
    serializer_class = CreatePlaylistSerializer
    def post(self, request, *args, **kwargs):
        try:
            serializer = self.serializer_class(data=request.data)
            if serializer.is_valid(raise_exception=True):
                # Get the new playlist information
                title = serializer.validated_data["title"]
                description = serializer.validated_data["description"]
                privacy = serializer.validated_data["privacy_status"]

                # Check if playlist already exists

                # create playlist
                response = create_playlist(title, description, privacy, request)

                if response:
                    msg = {'CreatePlaylistResponse': "Playlist created"}
                    return Response(msg, status=status.HTTP_200_OK)
                else:
                    msg = {'CreatePlaylistResponse': "Failed to create playlist"}
                    return Response(error_msg, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as err:
            error_msg = "Error while creating playlist: " + str(err)
           # print(error_msg)

            if "already exists!" in error_msg:
                return Response(error_msg, status=status.HTTP_409_CONFLICT)
            else:
                return Response(error_msg, status=status.HTTP_400_BAD_REQUEST)


def logout_view(request):
    '''Logs a user out and redirect to the homepage'''
    logout(request)
    return redirect('/')
