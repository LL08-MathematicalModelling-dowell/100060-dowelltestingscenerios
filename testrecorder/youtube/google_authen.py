import json
from django.http import HttpResponse
from django.shortcuts import redirect, render
from django.urls import reverse
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow

CLIENT_SECRETS_FILE = 'client_secrets.json'
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
    elif request.method == 'POST':
        # Retrieve the authorization code from the POST data
        authorization_code = request.POST.get('code')

        # Create the OAuth 2.0 flow
        flow = Flow.from_client_config(
        client_config={'client_id': CLIENT_ID, 'client_secret': CLIENT_SECRET},
        scopes=SCOPES,
        state=request.session.get('oauth_state', ''),
        redirect_uri='http://localhost:8000/youtube/auth/google/callback/'
        )

        # Exchange the authorization code for an access token
        flow.fetch_token(authorization_response=request.build_absolute_uri(), code=authorization_code)
        credentials = flow.credentials

        # Do something with the access token, such as store it in the user's session or database
        request.session['youtube_access_token'] = credentials.token

        return redirect('home')

    else:
        return render(request, 'error.html', {'message': 'Invalid request method'})
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
