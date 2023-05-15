import traceback
import logging
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials
from requests import HTTPError
from rest_framework.views import APIView
from rest_framework.renderers import JSONRenderer
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status, viewsets
from youtube.serializers import CreateChannnelSerializer
from .models import YoutubeUserCredential, ChannelsRecord


logger = logging.getLogger(__name__)


# class UserChannels(APIView):
#     # user must be authenticated to access this view
#     permission_classes = [IsAuthenticated]

#     def get(self, request, *args, **kwargs):
#         '''Get the logged-in user's YouTube channels'''

#         # retrieve the YoutubeUserCredential object associated with the currently authenticated user
#         try:
#             youtube_user = YoutubeUserCredential.objects.get(user=request.user)
#         except Exception:
#             # if the user doesn't have a YoutubeUserCredential object,
#             # return an error response with 401 Unauthorized status code
#             return Response({'Error': 'Account is not a Google account'}, status=status.HTTP_401_UNAUTHORIZED)

#         # retrieve the user's credentials associated with the YoutubeUserCredential object
#         credentials = Credentials.from_authorized_user_info(
#             info=youtube_user.credential)

#         # create a YouTube object using the v3 version of the API and the retrieved credentials
#         youtube = build('youtube', 'v3', credentials=credentials,
#                         cache_discovery=False)

#         try:
#             # retrieve the channels associated with the user's account
#             channels_response = youtube.channels().list(part='snippet', mine=True).execute()

#             # process the channels into a list of dictionaries containing the channel id and title
#             channels = [
#                 {
#                     'channel_id': channel['id'],
#                     'channel_title': channel['snippet']['title']
#                 }
#                 for channel in channels_response['items']
#             ]
#             try:
#                 channel_record, created = ChannelsRecord.objects.get_or_create(
#                     channel_id=channels[0].get('channel_id'),
#                     channel_title=channels[0].get(
#                         'channel_title'),
#                     channel_credentials=youtube_user.credential
#                 )
#                 channel_record.save()
#             except Exception:
#                 logger.warning(
#                     'Error while saving user channel credential locally!')
#             # return the channels in the response body with 200 OK status code
#             return Response(channels, status=status.HTTP_200_OK)
#         except Exception:
#             # if an exception is raised during any of the above steps,
#             # return an error response with 404 Not Found status code
#             Response({
#                 'Error': 'Unable to fetch YouTube channel(s) for this account,\
#                     make sure a channel is created for this account on www.youtube.com'},
#                 status=status.HTTP_404_NOT_FOUND
#             )

#         # if the execution reaches this point, return an empty response with 404 Not Found status code
#         return Response({}, status=status.HTTP_404_NOT_FOUND)


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
            except Exception:
                logger.warning(
                    'Error while saving user channel credential locally!')

            # Return the channels in the response body with 200 OK status code
            return Response(channels, status=status.HTTP_200_OK)
        except HTTPError as error:
            # If unable to fetch the YouTube channels, return an error response with 404 Not Found status code
            return Response({'Error': f'Unable to fetch YouTube channel(s) for this account: {error}'}, status=status.HTTP_404_NOT_FOUND)
