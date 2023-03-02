from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials
from rest_framework.views import APIView
from rest_framework.renderers import JSONRenderer
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import YouTubeUser
from .views import (SCOPES, API_SERVICE_NAME, API_VERSION, CLIENT_SECRETS_FILE)


class UserChannels(APIView):
    permission_classes = [IsAuthenticated]
    renderer_classes = [JSONRenderer]

    def get(self, request, *args, **kwargs):
        '''Gets Users Youtube channels'''
        print('============== USer ==', request.user)
        youtube_user = YouTubeUser.objects.get(user=request.user)
        # set up the OAuth 2.0 credentials
        # creds = Credentials.from_authorized_user_info(info={
        #     'access_token': youtube_user.access_token,
        #     'refresh_token': youtube_user.refresh_token,
        #     'token_uri': 'https://oauth2.googleapis.com/token',
        #     'client_id': '1012189436187-nk0sqhbhfodo72v5qc037nngs3hh4ojm.apps.googleusercontent.com',
        #     'client_secret': 'YGOCSPX-uIjC0L2rcP6DdhiwUAncTzMYgN6b',
        #     'scopes': SCOPES
        # })
        creds = Credentials.from_authorized_user_file(
            'path/to/client_secrets.json',
            scopes=SCOPES,
            access_token=youtube_user.access_token,
            refresh_token=youtube_user.refresh_token
        )

        # create an instance of the YouTube API client
        youtube = build(
            API_SERVICE_NAME, API_VERSION,
            credentials=creds, cache_discovery=False
            )

        channels_response = youtube.channels().list(part='snippet', mine=True).execute()
        channels = {
            {
                'channel_id': channel['id'],
                'channel_title': channel['snippet']['title']
            }
            for channel in channels_response['items']
        }

        return Response(channels, status=status.HTTP_200_OK)
