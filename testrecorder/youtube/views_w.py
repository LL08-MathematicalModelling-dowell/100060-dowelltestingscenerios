import json
import logging

import requests
from requests import HTTPError

from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials

from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from .models import YoutubeUserCredential, ChannelsRecord


logger = logging.getLogger(__name__)


class UserChannelsView(APIView):
    """
    This class is a DRF APIView that retrieves the authenticated user's YouTube channels.

    Methods:
      get(self, request, *args, **kwargs): Handles GET requests to this view and retrieves the
        channels associated with the currently
        authenticated user's YouTube account.
        Parameters:
        request: DRF Request object
        *args: tuple of positional arguments
        **kwargs: dictionary of keyword arguments

        Functionality:
            The get method retrieves the authenticated user's YouTube channels by first retrieving
            the YoutubeUserCredential object associated with the authenticated user. It then retrieves the user's
            credentials associated with the YoutubeUserCredential object and uses them to create a YouTube object using
            the v3 version of the API. It then retrieves the channels associated with the user's account and processes
            them into a list of dictionaries containing the channel id and title. It saves the first channel's details
            to a ChannelsRecord object and returns the channels in the response body with a 200 OK status code.
            If an exception is raised during any of the above steps, it returns an error response with a 404
            Not Found status code.

        Returns:
            If successful, returns a DRF Response object with a JSON array of dictionaries containing the channel id and
               title with a 200 OK status code.
            If the user doesn't have a YoutubeUserCredential object, returns a DRF Response object with an error message
                and a 401 Unauthorized status code.
            If unable to fetch the YouTube channels, returns a DRF Response object with an error message and
                a 404 Not Found status code.

    Attributes:
        permission_classes: a list containing the IsAuthenticated permission class to ensure only authenticated users
        can access this view.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        """
        Retrieve the authenticated user's YouTube channels.

        Returns a JSON array of dictionaries containing the channel id and title
        with a 200 OK status code. If the user doesn't have a YoutubeUserCredential
        object, returns a 401 Unauthorized status code. If unable to fetch the
        YouTube channels, returns a 404 Not Found status code.
        """

        try:
            # Retrieve the YoutubeUserCredential object associated with the authenticated user
            youtube_user = YoutubeUserCredential.objects.get(user=request.user)
            credential = youtube_user.credential

            # Get credential from dowell database
            user_email = request.user.email
            user_info = self.fetch_user_credential_from_dowell_connection_db(
                user_email)
            if user_info.get('data') is not None:
                credential_from_dowell_db = user_info.get(
                    'data').get('email_credentials')
               # print('credential_from_dowell_db ===> ',  credential_from_dowell_db)

        except YoutubeUserCredential.DoesNotExist:
            # If the user doesn't have a YoutubeUserCredential object,
            # return an error response with 401 Unauthorized status code
            return Response({'Error': 'Account is not a Google account'}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            # Retrieve the user's credentials associated with the YoutubeUserCredential object
            credentials = Credentials.from_authorized_user_info(
                info=credential)

            # Construct a Resource for interacting with an API.
            # Create a YouTube object using the v3 version of the API and the retrieved credentials
            youtube = build('youtube', 'v3',
                            credentials=credentials, cache_discovery=False)

            # Retrieve the channels associated with the user's account
            channels_response = youtube.channels().list(part='snippet', mine=True).execute()
            # print('channel Response ===> ', channels_response)
            if 'items' not in channels_response:
                return Response({'Error': 'There is no youtube channel associated with this account!'},
                                status=status.HTTP_404_NOT_FOUND)
            # Process the channels into a list of dictionaries containing the channel id and title
            channels = [
                {
                    'channel_id': channel['id'],
                    'channel_title': channel['snippet']['title']
                }
                for channel in channels_response['items']
            ]

            try:
                # Save the first channel's details to a ChannelsRecord object
                channel_record, created = ChannelsRecord.objects.get_or_create(
                    channel_id=channels[0].get('channel_id'),
                    channel_title=channels[0].get('channel_title'),
                    channel_credentials=credential
                )
                if created:
                    channel_record.save()
            except Exception as e:
                logger.error(
                    f'Error while saving user channel credential locally!: {e}  occured')

            # Return the channels in the response body with 200 OK status code
            return Response(channels, status=status.HTTP_200_OK)

        except HTTPError as e:
            status_code = e.resp.status
            error_message = e._get_reason()
            # If unable to fetch the YouTube channels, return an error response with 404 Not Found status code
            return Response(
                {'Error': error_message},
                status=status_code
            )
    '''
    def insert_user_credential_into_dowell_connection_db(self, channel, credential):
        """
        Inserts a new user youtube info record into the company's database

        Return:
            Json response from the database.
        """

        url = "http://100002.pythonanywhere.com/"

        payload = json.dumps({
            "cluster": "ux_live",
            "database": "ux_live",
            "collection": "credentials",
            "document": "credentials",
            "team_member_ID": "1200001",
            "function_ID": "ABCDE",
            "command": "insert",
            "field": {
                'channel_id': channel.get('channel_id'),
                'channel_title': channel.get('channel_title'),
                'channel_credentials': credential
            },
            "update_field": {
                "order_nos": 21
            },
            "platform": "bangalore"
        })
        headers = {
            'Content-Type': 'application/json'
        }

        response = requests.request(
            "POST", url, headers=headers, data=payload).json()
        print(response)
        return response

    def is_available_in_db(self,user, channel) -> bool:
        """
        Checks if record already exist in the database'

        Return:
            True: If record exist in the database.
            False: If record is not in the database.
        """
        url = "http://100002.pythonanywhere.com/"

        payload = json.dumps({
            "cluster": "ux_live",
            "database": "ux_live",
            "collection": "credentials",
            "document": "credentials",
            "team_member_ID": "1200001",
            "function_ID": "ABCDE",
            "command": "find",
            "field": {
                'user_id': user
                # 'channel_id': channel.get('channel_id')
            },
            "update_field": {
                "order_nos": 21
            },
            "platform": "bangalore"
        })
        headers = {
            'Content-Type': 'application/json'
        }

        response = requests.request(
            "POST", url, headers=headers, data=payload).json()

        if response.get('data') is None:
            return False

        print("xxx DB Response xx=> ", response)
        return True
    '''

    def is_available_in_db(self, email) -> bool:
        """
        Checks if record already exist in the database'

        Return:
            True: If record exist in the database.
            False: If record is not in the database.
        """
        url = "http://100002.pythonanywhere.com/"

        payload = json.dumps({
            "cluster": "ux_live",
            "database": "ux_live",
            "collection": "credentials",
            "document": "credentials",
            "team_member_ID": "1200001",
            "function_ID": "ABCDE",
            "command": "find",
            "field": {
                'user_email': email
            },
            "update_field": {
                "order_nos": 21
            },
            "platform": "bangalore"
        })
        headers = {
            'Content-Type': 'application/json'
        }

        response = requests.request(
            "POST", url, headers=headers, data=payload).json()

        if response.get('data') is None:
            return False

        print("xxx DB Response xx=> ", response)
        return True

    def fetch_user_credential_from_dowell_connection_db(self, email):
        """
        Inserts a new user youtube info record into the company's database

        Return:
            Json response from the database.
        """

        url = "http://100002.pythonanywhere.com/"

        payload = json.dumps({
            "cluster": "ux_live",
            "database": "ux_live",
            "collection": "credentials",
            "document": "credentials",
            "team_member_ID": "1200001",
            "function_ID": "ABCDE",
            "command": "find",
            "field": {
                'user_email': email,
            },
            "update_field": {
                "order_nos": 21
            },
            "platform": "bangalore"
        })
        headers = {
            'Content-Type': 'application/json'
        }

        response = requests.request(
            "POST", url, headers=headers, data=payload).json()

        return response


class DeleteVideoView(APIView):
    """
    API view class for deleting a video on YouTube.

    Methods:
        post(request): Delete a video based on the provided video ID.

    Attributes:
        permission_classes: a list containing the IsAuthenticated permission class to ensure only authenticated users
        can access this view.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        """
        POST request to delete a YouTube video.

        Parameters:
        - request: The HTTP request object.

        Returns:
        - Response: HTTP response indicating the result of the video deletion.

        Raises:
        - Http404: If the YoutubeUserCredential object is not found for the authenticated user.
        - Exception: If an error occurs while deleting the video.

        Authorization:
        - The user must be authenticated.

        Example:
        ```
        POST /api/delete-video/ --- (Link yet to implemented)
        {
            "video_id": "your_video_id"
        }
        ```
        """

        # Load credentials from the JSON key file obtained from the Google API Console
        try:
            # Retrieve the YoutubeUserCredential object associated with the authenticated user
            youtube_user = YoutubeUserCredential.objects.get(user=request.user)
        except YoutubeUserCredential.DoesNotExist:
            # If the user doesn't have a YoutubeUserCredential object,
            # return an error response with 401 Unauthorized status code
            return Response({'Error': 'Account is not a Google account'}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            # Retrieve the user's credentials associated with the YoutubeUserCredential object
            credentials = Credentials.from_authorized_user_info(
                info=youtube_user.credential)

            # Create a YouTube object using the v3 version of the API and the retrieved credentials
            youtube = build('youtube', 'v3',
                            credentials=credentials, cache_discovery=False)
            video_id = request.data.get('video_id')

            # Delete the video using the video ID
            # If successful, this method returns an HTTP 204 response code (No Content).
            response = youtube.videos().delete(id=video_id).execute()
            return Response({'message': "Video deleted successfully", 'response': response}, status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            # Return an error Response message
            return Response({'Error': str(e)})


class LoadVideoView(APIView):
    """
    API view class for loading all videos from YouTube.

    Methods:
        get(request): Load all videos
    
     Attributes:
        permission_classes: a list containing the IsAuthenticated permission class to ensure only authenticated users
        can access this view.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        Load all videos from YouTube.

        Parameters:
            request (HttpRequest): The HTTP request object.

        Returns:
            Response: A response containing the loaded videos.

        Raises:
            YoutubeUserCredential.DoesNotExist: If the authenticated user does not have a YoutubeUserCredential object.
            Exception: If an error occurs during the loading process.
        """
        try:
            # Retrieve the YoutubeUserCredential object associated with the authenticated user
            youtube_user = YoutubeUserCredential.objects.get(user=request.user)
        except YoutubeUserCredential.DoesNotExist:
            # If the user doesn't have a YoutubeUserCredential object,
            # return an error response with 401 Unauthorized status code
            return Response({'Error': 'Account is not a Google account'}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            # Retrieve the user's credentials associated with the YoutubeUserCredential object
            credentials = Credentials.from_authorized_user_info(
                info=youtube_user.credential)

            # Create a YouTube object using the v3 version of the API and the retrieved credentials
            youtube = build('youtube', 'v3',
                            credentials=credentials, cache_discovery=False)

            # Perform the YouTube Channels API call
            channels_response = youtube.channels().list(
                part='contentDetails',
                mine=True
            ).execute()

            channels = channels_response.get('items', [])
            if channels:
                channel_id = channels[0]['id']

                # Retrieve videos from each playlist
                playlists_response = youtube.playlists().list(
                    part='snippet,contentDetails',
                    channelId=channel_id,
                    maxResults=50
                ).execute()

                playlists = playlists_response.get('items', [])
                videos = []

                for playlist in playlists:
                    temp_playlist = {}
                    video = {}

                    temp_playlist['playlistTitle'] = playlist['snippet']['title']
                    temp_playlist['playlistId'] = playlist['id']

                    playlist_id = playlist['id']
                    playlist_items_response = youtube.playlistItems().list(
                        part='snippet',
                        playlistId=playlist_id,
                        maxResults=50
                    ).execute()

                    playlist_videos = playlist_items_response.get('items', [])
                    
                    video = [
                        {   
                            'videoId': videoItem['snippet']['resourceId']['videoId'],                     
                            'videoTitle': videoItem['snippet']['title'],                     
                            'videoThumbnail': videoItem['snippet']['thumbnails']['default']['url'],                    
                            'videoDescription': videoItem['snippet']['description'],
                        } for videoItem in playlist_videos
                    ]

                    temp_playlist['videos'] = video # playlist_videos

                    videos.append(temp_playlist)
            else:
                # Handle case when no channels are found
                videos = []

            return Response(videos)
        except Exception as e:
            # Return an error message
            return Response({'Error': str(e)})

