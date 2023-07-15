from flask import Flask, request, redirect, session, Response, jsonify
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
        e='Failed to retrieve access token.'
        error_message = {'error': e}
        return jsonify(error_message), 400

    session['credentials'] = credentials_to_dict(flow.credentials)
    #return redirect('/channel')
    return Response(status=200)

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

    #return f"Channel Title: {channel_info['title']}"
    return channel_info

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

@app.route('/createPlaylist', methods=['POST'])
def create_playlist():
    if 'credentials' not in session:
        return redirect('/')

    cred = credentials.Credentials.from_authorized_user_info(session['credentials'])
    youtube = googleapiclient.discovery.build(API_SERVICE_NAME, API_VERSION, credentials=cred)

    # Extract playlist details from the request
    playlist_title = request.form.get('title')
    playlist_description = request.form.get('description')

    # Create a new playlist
    new_playlist = youtube.playlists().insert(
        part='snippet',
        body={
            'snippet': {
                'title': playlist_title,
                'description': playlist_description
            }
        }
    ).execute()

    return jsonify(new_playlist)

@app.route('/startLiveStream', methods=['POST'])
def start_live_stream():
    if 'credentials' not in session:
        return redirect('/')

    cred = credentials.Credentials.from_authorized_user_info(session['credentials'])
    youtube = googleapiclient.discovery.build(API_SERVICE_NAME, API_VERSION, credentials=cred)

    # Extract live stream details from the request
    title = request.form.get('title')
    description = request.form.get('description')
    
    time_delt1 = timedelta(days=0, hours=0, minutes=1)  # ToDo use milliseconds
    # time_now = datetime.now()
    time_now = datetime.utcnow()
    future_date1 = time_now + time_delt1
    future_date_iso = future_date1.isoformat()
    # Start a live broadcast
    live_broadcast = youtube.liveBroadcasts().insert(
        part='snippet,status',
        body={
            'snippet': {
                'title': 'title',
                'description': 'description',
                'scheduledStartTime': future_date_iso,
            },
            'status': {
                'privacyStatus': 'public'
            }
        }
    ).execute()

    # Retrieve the broadcast ID and status
    broadcast_id = live_broadcast['id']
    broadcast_status = live_broadcast['status']['lifeCycleStatus']

    # If the broadcast is active, return the broadcast ID
    if broadcast_status == 'live':
        return jsonify({'broadcast_id': broadcast_id})
    else:
        return jsonify({'error': 'Failed to start live stream'})

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
