import traceback
import logging
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials
from rest_framework.views import APIView
from rest_framework.renderers import JSONRenderer
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status, viewsets
from youtube.serializers import CreateChannnelSerializer
from .models import YoutubeUserCredential, ChannelsRecord


logger = logging.getLogger(__name__)


class UserChannels(APIView):
    # user must be authenticated to access this view
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        '''Get the logged-in user's YouTube channels'''

        # retrieve the YoutubeUserCredential object associated with the currently authenticated user
        try:
            youtube_user = YoutubeUserCredential.objects.get(user=request.user)
        except Exception:
            # if the user doesn't have a YoutubeUserCredential object,
            # return an error response with 401 Unauthorized status code
            return Response({'Error': 'Account is not a Google account'}, status=status.HTTP_401_UNAUTHORIZED)

        # retrieve the user's credentials associated with the YoutubeUserCredential object
        credentials = Credentials.from_authorized_user_info(
            info=youtube_user.credential)

        # create a YouTube object using the v3 version of the API and the retrieved credentials
        youtube = build('youtube', 'v3', credentials=credentials,
                        cache_discovery=False)

        try:
            # retrieve the channels associated with the user's account
            channels_response = youtube.channels().list(part='snippet', mine=True).execute()

            # process the channels into a list of dictionaries containing the channel id and title
            channels = [
                {
                    'channel_id': channel['id'],
                    'channel_title': channel['snippet']['title']
                }
                for channel in channels_response['items']
            ]
            try:
                channel_record, created = ChannelsRecord.objects.get_or_create(
                    channel_id=channels[0].get('channel_id'),
                    channel_title=channels[0].get(
                        'channel_title'),
                    channel_credentials=youtube_user.credential
                )
                channel_record.save()
            except Exception:
                logger.warning(
                    'Error while saving user channel credential locally!')
            # return the channels in the response body with 200 OK status code
            return Response(channels, status=status.HTTP_200_OK)
        except Exception:
            # if an exception is raised during any of the above steps,
            # return an error response with 404 Not Found status code
            Response({
                'Error': 'Unable to fetch YouTube channel(s) for this account,\
                    make sure a channel is created for this account on www.youtube.com'},
                status=status.HTTP_404_NOT_FOUND
            )

        # if the execution reaches this point, return an empty response with 404 Not Found status code
        return Response({}, status=status.HTTP_404_NOT_FOUND)


'''
class CreateChannel(APIView):
    """Create a new YouTube channel for loggein user"""
    permission_classes = [
        IsAuthenticated]  # user must be authenticated to access this view
    serializer_class = CreateChannnelSerializer

    def get(self, request, *args, **kwargs):
        return Response({'Error': 'Method not allowed!'}, status=status.HTTP_405_METHOD_NOT_ALLOWED)

    def post(self, request, *args, **kwargs):
        """Handles POst requests and create user channel through google Youtube API """
        serializer = CreateChannnelSerializer(data=request.data)
        # retrieve the YoutubeUserCredential object associated with the currently authenticated user
        if serializer.is_valid():
            try:
                youtube_user = YoutubeUserCredential.objects.get(
                    user=request.user)
                credentials = Credentials.from_authorized_user_info(
                    info=youtube_user.credential)

                print('====== serializer data ==>> ', serializer.data)
                print('== credentials ==> ', credentials)
                print('======= user => ', youtube_user)
                data = serializer.data
                channel_id = self.create_youtube_channel(credentials, data)
                print('=== new id == ', channel_id)

                respons_data = {
                    'id': channel_id,
                    'channel_title': data.get('title')
                }
                return Response(respons_data, status=status.HTTP_201_CREATED)
            except Exception:
                print('An error occurred:')
                traceback.print_exc()
                # if the user doesn't have a YoutubeUserCredential object,
                # return an error response with 401 Unauthorized status code
                return Response({'Error': 'Account is not a Google account'}, status=status.HTTP_401_UNAUTHORIZED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def create_youtube_channel(self, credentials, data):
        # Build the YouTube API client
        youtube = build('youtube', 'v3', credentials=credentials)

        print('=============== channel creation ====')
        # print('channels =>',[channel for channel in youtube.channels().list() ])

        # Create a new channel with the specified title and description
        channel_title = data.get('title')
        channel_description = data.get('description')
        channel_body = {
            'snippet': {
                'title': channel_title,
                'description': channel_description,
            },
            'status': {
                'privacyStatus': 'public',  # set the channel privacy status
            }
        }
        channel_response = youtube.channels().insert(
            part='snippet,status', body=channel_body).execute()

        # Extract the new channel ID from the response
        channel_id = channel_response['id']
        print('========== Channel ID ========', channel_id)

        # Return the channel ID
        return channel_id


create_channel = CreateChannel.as_view()
'''
