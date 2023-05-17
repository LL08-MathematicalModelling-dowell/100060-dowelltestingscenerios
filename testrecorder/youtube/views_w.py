import json
import logging
import requests
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials
from requests import HTTPError
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import YoutubeUserCredential, ChannelsRecord


logger = logging.getLogger(__name__)


class UserChannels(APIView):
    """
    This class is a DRF APIView that retrieves the authenticated user's YouTube channels.

    Methods:
      get(self, request, *args, **kwargs): Handles GET requests to this view and retrieves the channels associated with the currently
        authenticated user's YouTube account.
        Parameters:
        request: DRF Request object
        *args: tuple of positional arguments
        **kwargs: dictionary of keyword arguments

        Functionality:
            The get method retrieves the authenticated user's YouTube channels by first retrieving the 
            YoutubeUserCredential object associated with the authenticated user. It then retrieves the user's 
            credentials associated with the YoutubeUserCredential object and uses them to create a YouTube object using 
            the v3 version of the API. It then retrieves the channels associated with the user's account and processes 
            them into a list of dictionaries containing the channel id and title. It saves the first channel's details 
            to a ChannelsRecord object and returns the channels in the response body with a 200 OK status code.
            If an exception is raised during any of the above steps, it returns an error response with a 404 Not Found status code.

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

            # Retrieve the channels associated with the user's account
            channels_response = youtube.channels().list(part='snippet', mine=True).execute()

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
                    channel_credentials=youtube_user.credential
                )
                if created:
                    channel_record.save()
                response = self.dowell_connection_db_insert(
                    channels[0], youtube_user.credential)
                print(
                    'xxxxxxDowell db youtube credential insert  response ====> ', response)
            except Exception as e:
                logger.warning(
                    f'Error while saving user channel credential locally!: {e}  occured')

            # Return the channels in the response body with 200 OK status code
            return Response(channels, status=status.HTTP_200_OK)
        except HTTPError as e:
            status_code = e.resp.status
            error_message = e._get_reason()
            # If unable to fetch the YouTube channels, return an error response with 404 Not Found status code
            return Response({'Error': 'Unable to fetch YouTube channel for this account', 'message': error_message}, status=status_code)

    def dowell_connection_db_insert(self, channel, credential):
        """
            Inserts a record in to the company's database
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

        response = requests.request("POST", url, headers=headers, data=payload)
        print(response.text)
        return response.text


class DeleteVideo(APIView):
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
        POST /api/delete-video/
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
            return Response({'message':"Video deleted successfully", 'response': response}, status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            # Handle specific HTTP errors returned by the API
            status_code = e.resp.status
            error_message = e._get_reason()
            # Return an error Response message
            return Response({'Error': error_message}, status=status_code)
