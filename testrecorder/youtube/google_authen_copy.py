import json
from django.dispatch import receiver
from django.http import HttpResponse
from google_auth_oauthlib.flow import Flow
from django.contrib.auth.decorators import login_required
from django.shortcuts import redirect
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from .models import YouTubeUser
from allauth.socialaccount.models import SocialLogin
from allauth.socialaccount.signals import pre_social_login,social_account_updated, social_account_added, social_account_removed




CLIENT_SECRETS_FILE = 'client_secret.json'
# SCOPES = ['https://www.googleapis.com/auth/youtube.readonly']
SCOPES = [
    "https://www.googleapis.com/auth/youtube.force-ssl",
    "openid",
    "https://www.googleapis.com/auth/userinfo.profile",
    "https://www.googleapis.com/auth/youtube.force-ssl",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/youtube.readonly"
]
CLIENT_ID = "1012189436187-nk0sqhbhfodo72v5qc037nngs3hh4ojm.apps.googleusercontent.com"
CLIENT_SECRET = "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"
TOKEN_URI = 'https://oauth2.googleapis.com/token'

def youtube_auth(request):
    # Create the OAuth 2.0 flow
    flow = Flow.from_client_secrets_file(
        CLIENT_SECRETS_FILE,
        scopes=SCOPES,
        state=request.session.get('oauth_state', ''),
        redirect_uri='http://localhost:8000/youtube/auth/google/callback/'
    )
    # Generate the authorization URL and redirect the user
    authorization_url, state = flow.authorization_url(
        access_type='offline',
        include_granted_scopes='true'
    )

    print('=================== State =============================')
    print(state)
    print('====================================== OK ===========================')
    return redirect(authorization_url)


'''
def youtube_callback(request):
    print('========= call back =========')
    # Retrieve the authorization code from the request parameters
    authorization_code = request.GET.get('code')
    print('authorization_code ====> ', authorization_code)

    # Create the OAuth 2.0 flow
    flow = Flow.from_client_secrets_file(
        CLIENT_SECRETS_FILE,
        scopes=SCOPES,
        state=request.session.get('oauth_state', ''),
        redirect_uri='http://localhost:8000/youtube/auth/google/callback/'
    )

    # Exchange the authorization code for an access token
    flow.fetch_token(authorization_response=request.build_absolute_uri())
    credentials = flow.credentials
    print('Credentia:  ', credentials.__dict__)
    with open('user_credentials.txt', 'w') as f:
        f.write(str(credentials.__dict__))
        # json.dump(credentials.__dict__, f, indent=4)
    # Do something with the access token, such as store it in the user's session or database
    request.session['youtube_access_token'] = credentials.token

    return redirect('home')


def clear_session(request):
    request.session.clear()
    return HttpResponse('Session cleared!')
'''

@receiver(social_account_removed)
def youtube_auth_callback(sender, request, sociallogin, **kwargs):
    print('======== user removed=======')

@receiver([social_account_updated, social_account_added])
def youtube_auth_callback(request, sociallogin, **kwargs):
    print('=============== Signal Reciever ===============')
    if sociallogin.account.provider == 'google':
        print('====== Acct is Social')
        print('== state => ', request.GET.get('state', ''))
        print('==code==> ', request.GET.get('code', ''))

        code = sociallogin.token.token_secret
        print('===code==>2 ', code)
        state = sociallogin.state
        print('===state==2', state)
        # Check if the user is logging in for the first time
        # Set up the Google OAuth2 flow
        # flow = Flow.from_client_secrets_file(
        #     CLIENT_SECRETS_FILE,
        #     scopes= request.GET.get('coe', ''), # SCOPES,
        #     state=request.GET.get('state', ''), #request.session.get('oauth_state', ''),
        #     redirect_uri='http://127.0.0.1:8000/accounts/google/login/callback/'
        # )

        # Get the authorization code from the callback URL and exchange it for a token
        # flow.fetch_token(code=request.GET.get('code', '')) #request.GET.get('code', ''))
        # credentials = flow.credentials
        print('==================== Flow created ================')
        # Get the user's YouTube channel ID and username
        # youtube = build('youtube', 'v3', credentials=credentials)
        # channels_response = youtube.channels().list(part='snippet', mine=True).execute()
        # channel = channels_response['items'][0]
        # channel_id = channel['id']
        # channel_title = channel['snippet']['title']

        # Save the user's credentials and YouTube information to the database
        youtube_user, created = YouTubeUser.objects.get_or_create(
            user=request.user)
        youtube_user.access_token =  sociallogin.token.token# credentials.token
        youtube_user.refresh_token = sociallogin.token.token_secret #credentials.refresh_token
        # youtube_user.token_uri = sociallogin.token.token_type_uri # credentials.token_uri
        youtube_user.save()
        print('================= User cred Saed ================')

        print(
            'User logged in with Google account and YouTube credentials saved to the database.')
    else:
        print(
            'User logged in with Google account but already has YouTube credentials in the database.')

    '''
    # Exchange the authorization code for a credentials object
    flow = Flow.from_client_secrets_file(
        CLIENT_SECRETS_FILE,
        scopes=SCOPES,
        state=request.session.get('oauth_state', ''),
        redirect_uri='http://localhost:8000/youtube/auth/google/callback/'
    )
    flow.fetch_token(code=request.GET.get('code', ''))
    credentials = flow.credentials

    # Get the user's YouTube channel ID and username
    youtube = build('youtube', 'v3', credentials=credentials)
    channels_response = youtube.channels().list(part='snippet', mine=True).execute()
    channel = channels_response['items'][0]
    print('============= Channels =====> ', channel)
    channel_id = channel['id']
    channel_title = channel['snippet']['title']

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
    '''
