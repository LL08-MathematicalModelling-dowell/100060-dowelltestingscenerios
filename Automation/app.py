from flask import Flask, request, redirect, session
from flask_restful import Api
from google.oauth2 import credentials
from login import login
from home import home
from google_auth_oauthlib.flow import Flow
import googleapiclient.discovery
import os 
app = Flask(__name__)
api = Api(app)
app.config['SESSION_COOKIE_NAME'] = 'google-login-session'
app.config.update(SECRET_KEY=os.urandom(24))
CLIENT_SECRETS_FILE = "client_secrets.json"
SCOPES = ['https://www.googleapis.com/auth/youtube.readonly', "https://www.googleapis.com/auth/youtube.upload"]
API_SERVICE_NAME = "youtube"
API_VERSION = "v3"
os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'

# api.add_resource(login, "/login")
# api.add_resource(home,"/")
flow = Flow.from_client_secrets_file(
    CLIENT_SECRETS_FILE,
    scopes=SCOPES,
    redirect_uri='http://localhost:8000/callback'
)

@app.route('/')
def index():
    authorization_url, _ = flow.authorization_url(prompt='consent')
    return redirect(authorization_url)

@app.route('/callback')
def callback():
    flow.fetch_token(authorization_response=request.url)
    if not flow.credentials:
        return 'Failed to retrieve access token.'

    session['credentials'] = credentials_to_dict(flow.credentials)
    return redirect('/channel')

@app.route('/channel')
def channel():
    if 'credentials' not in session:
        return redirect('/')

    cred = credentials.Credentials.from_authorized_user_info(session['credentials'])
    print(cred)
    youtube = googleapiclient.discovery.build(API_SERVICE_NAME, API_VERSION, credentials=cred)

    # Fetch YouTube channel information
    channels_response = youtube.channels().list(
        mine=True,
        part='snippet'
    ).execute()

    # Extract channel information
    channel_info = channels_response['items'][0]['snippet']

    return f"Channel Title: {channel_info['title']}"
    # return channel_info

@app.route('/playlists')
def playlists():
    if 'credentials' not in session:
        return redirect('/')

    cred = credentials.Credentials.from_authorized_user_info(session['credentials'])
    youtube = googleapiclient.discovery.build(API_SERVICE_NAME, API_VERSION, credentials=cred)

    # Fetch user's playlists
    playlists_response = youtube.playlists().list(
        part='snippet',
        mine=True
    ).execute()

    # Extract playlist information
    playlists = playlists_response['items']
    playlist_titles = [playlist['snippet']['title'] for playlist in playlists]

    # return f"Playlists: {', '.join(playlist_titles)}"
    return playlists

def credentials_to_dict(credentials):
    return {
        'token': credentials.token,
        'refresh_token': credentials.refresh_token,
        'token_uri': credentials.token_uri,
        'client_id': credentials.client_id,
        'client_secret': credentials.client_secret,
        'scopes': credentials.scopes
    }
if __name__ == "__main__":
  app.run(host="127.0.0.1",port=8000)