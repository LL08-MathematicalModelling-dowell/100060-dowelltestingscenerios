from django.shortcuts import redirect
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from allauth.socialaccount.views import OAuth2CallbackView
from .models import YouTubeUser

from allauth.socialaccount.providers.oauth2.views import OAuth2CallbackView

class GoogleOAuth2CallbackView(OAuth2CallbackView):
    adapter_class = GoogleOAuth2Adapter

    def get(self, request, *args, **kwargs):
        # Call parent class's get method to handle authentication
        response = super(GoogleOAuth2CallbackView, self).get(request, *args, **kwargs)
        # Check if authentication was successful
        if response.status_code == 200:
            # Exchange the authorization code for a credentials object
            flow = self.adapter_class.get_auth_flow(request)
            flow.fetch_token(code=request.GET.get('code', ''))

            # Get the user's YouTube channel ID and username
            try:
                credentials = flow.credentials
                # youtube = build('youtube', 'v3', credentials=credentials)
                # channels_response = youtube.channels().list(part='snippet', mine=True).execute()
                # channel = channels_response['items'][0]
                # channel_id = channel['id']
                # channel_title = channel['snippet']['title']

                # Save the user's credentials and YouTube information to the database
                youtube_user, created = YouTubeUser.objects.get_or_create(user=request.user)
                # youtube_user.youtube_user_id = channel_id
                # youtube_user.youtube_user_name = channel_title
                youtube_user.access_token = credentials.token
                youtube_user.refresh_token = credentials.refresh_token
                youtube_user.token_uri = credentials.token_uri
                youtube_user.save()

                # Redirect the user to the home page
                return redirect('home')
            except HttpError as error:
                print(f'An error occurred: {error}')
                # Handle error here
        else:
            # Handle error here
            print('Error: User authentication failed')

oauth2_callback = GoogleOAuth2CallbackView.adapter_view(GoogleOAuth2Adapter)

'''
    if sociallogin.account.provider == 'google':
        # Check if the user is logging in for the first time
        if sociallogin.is_new:
            # Set up the Google OAuth2 flow
            CLIENT_SECRETS_FILE = 'path/to/client_secrets.json'
            SCOPES = ['https://www.googleapis.com/auth/youtube.force-ssl']
            flow = Flow.from_client_secrets_file(
                CLIENT_SECRETS_FILE,
                scopes=SCOPES,
                state=request.session.get('oauth_state', ''),
                redirect_uri='http://localhost:8000/youtube/auth/google/callback/'
            )

            # Get the authorization code from the callback URL and exchange it for a token
            flow.fetch_token(code=request.GET.get('code', ''))
            credentials = flow.credentials

            # Get the user's YouTube channel ID and username
            youtube = build('youtube', 'v3', credentials=credentials)
            channels_response = youtube.channels().list(part='snippet', mine=True).execute()
            channel = channels_response['items'][0]
            channel_id = channel['id']
            channel_title = channel['snippet']['title']

            # Save the user's credentials and YouTube information to the database
            youtube_user, created = YouTubeUser.objects.get_or_create(user=request.user)
            youtube_user.youtube_user_id = channel_id
            youtube_user.youtube_user_name = channel_title
            youtube_user.access_token = credentials.token
            youtube_user.refresh_token = credentials.refresh_token
            youtube_user.token_uri = credentials.token_uri
            youtube_user.save()

            print('User logged in with Google account and YouTube credentials saved to the database.')
        else:
            print('User logged in with Google account but already has YouTube credentials in the database.')


    '''