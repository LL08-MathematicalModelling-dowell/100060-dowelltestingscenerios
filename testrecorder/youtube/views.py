# youtube/views.py
from django.http import HttpResponse

# -*- coding: utf-8 -*-

import os
import requests
import google.oauth2.credentials
import google_auth_oauthlib.flow
import googleapiclient.discovery
from datetime import date
from datetime import time
from datetime import datetime, timezone
from datetime import timedelta
import json
from django.shortcuts import redirect
from django.conf import settings
from rest_framework.reverse import reverse
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from rest_framework.renderers import JSONRenderer
import pymongo
from youtube.models import ChannelsRecord


# When running locally, disable OAuthlib's HTTPs verification.
# ACTION ITEM for developers:
#     When running in production *do not* leave this option enabled.
os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'
os.environ['OAUTHLIB_RELAX_TOKEN_SCOPE'] = '1'

credentials_file = settings.BASE_DIR+'/youtube/credentials.json'

# This variable specifies the name of a file that contains the OAuth 2.0
# information for this application, including its client_id and client_secret.
CLIENT_SECRETS_FILE = settings.BASE_DIR+'/youtube/client_secret.json'

# This OAuth 2.0 access scope allows for full read/write access to the
# authenticated user's account and requires requests to use an SSL connection.
SCOPES = ['https://www.googleapis.com/auth/youtube.force-ssl', 'openid', 'https://www.googleapis.com/auth/userinfo.profile',
          'https://www.googleapis.com/auth/youtube.force-ssl', 'https://www.googleapis.com/auth/userinfo.email', "https://www.googleapis.com/auth/youtube.readonly"]
API_SERVICE_NAME = 'youtube'
API_VERSION = 'v3'


def get_channel_credentials(request, the_channel_title):
    """
        Gets the channel details using the channel title
    """
    # Check if session has channel information
    if not request.session.get('channel_details'):
        # Fetch credentials and add to session
        queryset = ChannelsRecord.objects.filter(
            channel_title = the_channel_title)
        if queryset.exists():
            fetched_channel = queryset.first()
            print("Channel id: ", fetched_channel.channel_id)
            print("Channel title: ", fetched_channel.channel_title)
            #print("Channel credentials: ", fetched_channel.channel_credentials)
            request.session['channel_details'] = {
                "channel_id":fetched_channel.channel_id,
                "channel_title":fetched_channel.channel_title,
                "channel_credentials": fetched_channel.channel_credentials
            }

            # Test session channel information
            """session_channel = request.session.get('channel_details')
            print("Session Channel id: ", session_channel["channel_id"])
            print("Session Channel title: ", session_channel["channel_title"])
            print("Session Channel credentials: ", session_channel["channel_credentials"])"""
        else:
            msg = "A channel with the title "+the_channel_title+" does not exist!"
            raise Exception(msg)
    else:
        print("session has credentials")

    # Check if the channel is session is same as the one we need
    session_channel = request.session.get('channel_details')
    if the_channel_title != session_channel["channel_title"]:
        print("session has different credentials")
                # Fetch credentials and add to session
        queryset = ChannelsRecord.objects.filter(
            channel_title = the_channel_title)
        if queryset.exists():
            fetched_channel = queryset.first()
            print("Channel id: ", fetched_channel.channel_id)
            print("Channel title: ", fetched_channel.channel_title)
            #print("Channel credentials: ", fetched_channel.channel_credentials)
            request.session['channel_details'] = {
                "channel_id":fetched_channel.channel_id,
                "channel_title":fetched_channel.channel_title,
                "channel_credentials": fetched_channel.channel_credentials
            }

            # Test session channel information
            """print("Session Channel id: ", session_channel["channel_id"])
            print("Session Channel title: ", session_channel["channel_title"])
            print("Session Channel credentials: ", session_channel["channel_credentials"])"""
        else:
            msg = "A channel with the title "+the_channel_title+" does not exist!"
            raise Exception(msg)
    else:
        print("session has the credentials we need")

    # Return current credentials
    session_channel = request.session.get('channel_details')
    current_channel_credentials = session_channel["channel_credentials"]
    return current_channel_credentials


def index(request):
    return HttpResponse(print_index_table())


def test_api_request(request):
    if not request.session.get('credentials'):
        response = redirect('authorize')
        return response

    # Load credentials from the session.
    credentials = google.oauth2.credentials.Credentials(
        **request.session.get('credentials'))

    youtube = googleapiclient.discovery.build(
        API_SERVICE_NAME, API_VERSION, credentials=credentials, cache_discovery=False)

    channel = youtube.channels().list(mine=True, part='snippet').execute()

    # Save credentials back to session in case access token was refreshed.
    # ACTION ITEM: In a production app, you likely want to save these
    #              credentials in a persistent database instead.
    request.session['credentials'] = credentials_to_dict(credentials)

    # Save credentials in json file
    credentials_dict = credentials_to_dict(credentials)
    with open(credentials_file, "w") as write_file:
        json.dump(credentials_dict, write_file, indent=4)

    #json_channel = json.dumps(channel, indent = 4)
    json_channel = json.dumps(channel)
    print(json_channel)
    return HttpResponse(json_channel)


def insert_broadcast(youtube):
    """
        Creates a liveBroadcast resource and set its title, scheduled start time,
        scheduled end time, and privacy status.
    """
    # create broadcast time
    time_delt1 = timedelta(days=0, hours=0, minutes=5)  # ToDo use milliseconds
    # time_now = datetime.now()
    time_now = datetime.utcnow()
    future_date1 = time_now + time_delt1
    future_date_iso = future_date1.isoformat()
    videoPrivacyStatus = "private"  # ToDo get this from request
    testNameValue = "Python tests"  # ToDo get this from request
    videoTitle = "Test Record Broadcast " + testNameValue + " " + future_date_iso
    print(future_date_iso)

    request = youtube.liveBroadcasts().insert(
        part="snippet,contentDetails,statistics,status",
        body={
            "status": {
                # "privacyStatus": "private",
                # "privacyStatus": "public",
                "privacyStatus": videoPrivacyStatus,
                "selfDeclaredMadeForKids": False
            },
            "snippet": {
                "scheduledStartTime": future_date_iso,
                "title": videoTitle
            },
            "contentDetails": {
                "enableAutoStart": True,
                "enableAutoStop": True
            }
        }
    )

    insert_broadcast_response = request.execute()
    print(insert_broadcast_response)

    snippet = insert_broadcast_response["snippet"]

    print("Broadcast '%s' with title '%s' was published at '%s'." % (
        insert_broadcast_response["id"], snippet["title"], snippet["publishedAt"]))

    return insert_broadcast_response["id"]


def insert_stream(youtube):
    """
        Creates a liveStream resource and set its title, format, and ingestion type.
        This resource describes the content that you are transmitting to YouTube.
    """
    request = youtube.liveStreams().insert(
        part="snippet,cdn,contentDetails,status",
        body={
            "cdn": {
                "frameRate": "variable",
                "ingestionType": "rtmp",
                "resolution": "variable"
            },
            "contentDetails": {
                "isReusable": False
            },
            "snippet": {
                "title": "A non reusable stream",
                "description": "A stream to be used once."
            }
        }
    )

    insert_stream_response = request.execute()
    print(insert_stream_response)

    snippet = insert_stream_response["snippet"]
    cdn = insert_stream_response["cdn"]
    ingestionInfo = cdn["ingestionInfo"]

    print("Stream '%s' with title '%s' was inserted." % (
        insert_stream_response["id"], snippet["title"]))

    newStreamId = insert_stream_response["id"]
    newStreamName = ingestionInfo["streamName"]
    newStreamIngestionAddress = ingestionInfo["rtmpsIngestionAddress"]
    print("New stream id: ", newStreamId)
    print("New stream name: ", newStreamName)
    print("New stream ingestion address: ", newStreamIngestionAddress)
    newRtmpUrl = newStreamIngestionAddress + "/" + newStreamName
    print("New stream RTMP url: ", newRtmpUrl)

    stream_dict = {"newStreamId": newStreamId,
                   "newStreamName": newStreamName,
                   "newStreamIngestionAddress": newStreamIngestionAddress,
                   "newRtmpUrl": newRtmpUrl
                   }
    return stream_dict


def bind_broadcast(youtube, broadcast_id, stream_id):
    """
        Binds the broadcast to the video stream. By doing so, you link the video that
        you will transmit to YouTube to the broadcast that the video is for.
    """
    request = youtube.liveBroadcasts().bind(
        part="id,contentDetails",
        id=broadcast_id,
        streamId=stream_id
    )

    bind_broadcast_response = request.execute()

    print("Broadcast '%s' was bound to stream '%s'." % (
        bind_broadcast_response["id"],
        bind_broadcast_response["contentDetails"]["boundStreamId"]))


def create_broadcast(request):
    """
        Creates a broadcast, it is view based.
    """

    # Opening JSON file
    with open('credentials.json') as json_file:
        credentials = json.load(json_file)

    credentials = google.oauth2.credentials.Credentials(**credentials)

    youtube = googleapiclient.discovery.build(
        API_SERVICE_NAME, API_VERSION, credentials=credentials, cache_discovery=False)

    # create broadcast time
    time_delt1 = timedelta(days=0, hours=0, minutes=5)
    # time_now = datetime.now()
    time_now = datetime.utcnow()
    future_date1 = time_now + time_delt1
    future_date_iso = future_date1.isoformat()
    print(future_date_iso)

    # Create broadcast
    new_broadcast_id = insert_broadcast(youtube)

    # Create stream
    stream_dict = insert_stream(youtube)

    # Bind livestream and broadcast
    stream_dict['new_broadcast_id'] = new_broadcast_id
    stream_id = stream_dict['newStreamId']
    bind_broadcast(youtube, new_broadcast_id, stream_id)

    # Serializing json
    json_stream_dict = json.dumps(stream_dict)
    print(json_stream_dict)

    # return json_stream_dict
    return HttpResponse(json_stream_dict)


def authorize(request):
    print("Inside authorize ......")
    # Create flow instance to manage the OAuth 2.0 Authorization Grant Flow steps.
    flow = google_auth_oauthlib.flow.Flow.from_client_secrets_file(
        CLIENT_SECRETS_FILE, scopes=SCOPES)

    # The URI created here must exactly match one of the authorized redirect URIs
    # for the OAuth 2.0 client, which you configured in the API Console. If this
    # value doesn't match an authorized URI, you will get a 'redirect_uri_mismatch'
    # error.
    url = reverse('oauth2callback', request=request)
    print("Reversed URL: ", url)

    flow.redirect_uri = url

    authorization_url, state = flow.authorization_url(
        # Enable offline access so that you can refresh an access token without
        # re-prompting the user for permission. Recommended for web server apps.
        access_type='offline',
        # Enable incremental authorization. Recommended as a best practice.
        include_granted_scopes='true')

    # Store the state so the callback can verify the auth server response.
    request.session['state'] = state

    request.session['authorization_url'] = authorization_url
    print("authorization_url: ", authorization_url)
    response = redirect(authorization_url)
    return response


def oauth2callback(request):
    print("Request: ", request)
    #print("Request.GET: ", request.GET)
    #print("request.GET.keys(): ", request.GET.keys())
    currentUrl = request.get_full_path()
    print("request currentUrl: ", currentUrl)
    # Specify the state when creating the flow in the callback so that it can
    # verified in the authorization server response.
    state = request.session['state']

    flow = google_auth_oauthlib.flow.Flow.from_client_secrets_file(
        CLIENT_SECRETS_FILE, scopes=SCOPES, state=state)

    url = reverse('oauth2callback', request=request)
    print("Reversed URL: ", url)
    flow.redirect_uri = url

    # Use the authorization server's response to fetch the OAuth 2.0 tokens.
    request_url = request.session.get('authorization_url')
    authorization_response = currentUrl
    flow.fetch_token(authorization_response=authorization_response)

    # Store credentials in the session.
    # ACTION ITEM: In a production app, you likely want to save these
    #              credentials in a persistent database instead.
    credentials = flow.credentials
    print("OAUTH credentials: ", credentials)
    request.session['credentials'] = credentials_to_dict(credentials)

    response = redirect('test_api_request')
    return response


def revoke(request):
    if not request.session.get('credentials'):
        return HttpResponse('You need to <a href="/youtube/authorize">authorize</a> before ' +
                            'testing the code to revoke credentials.')

    credentials = google.oauth2.credentials.Credentials(
        **request.session['credentials'])

    revoke = requests.post('https://oauth2.googleapis.com/revoke',
                           params={'token': credentials.token},
                           headers={'content-type': 'application/x-www-form-urlencoded'})

    status_code = getattr(revoke, 'status_code')
    if status_code == 200:
        return HttpResponse('Credentials successfully revoked.' + print_index_table())
    else:
        return HttpResponse('An error occurred.' + print_index_table())


def clear_credentials(request):
    if request.session.get('credentials'):
        del request.session['credentials']

    return HttpResponse('Credentials have been cleared.<br><br>' +
                        print_index_table())


def credentials_to_dict(credentials):
    return {'token': credentials.token,
            'refresh_token': credentials.refresh_token,
            'token_uri': credentials.token_uri,
            'client_id': credentials.client_id,
            'client_secret': credentials.client_secret,
            'scopes': credentials.scopes}


def print_index_table():
    return ('<table>' +
            '<tr><td><a href="/youtube/test">Test an API request</a></td>' +
            '<td>Submit an API request and see a formatted JSON response. ' +
            '    Go through the authorization flow if there are no stored ' +
            '    credentials for the user.</td></tr>' +
            '<tr><td><a href="/youtube/authorize">Test the auth flow directly</a></td>' +
            '<td>Go directly to the authorization flow. If there are stored ' +
            '    credentials, you still might not be prompted to reauthorize ' +
            '    the application.</td></tr>' +
            '<tr><td><a href="/youtube/revoke">Revoke current credentials</a></td>' +
            '<td>Revoke the access token associated with the current user ' +
            '    session. After revoking credentials, if you go to the test ' +
            '    page, you should see an <code>invalid_grant</code> error.' +
            '</td></tr>' +
            '<tr><td><a href="/youtube/clear">Clear App session credentials</a></td>' +
            '<td>Clear the access token currently stored in the user session. ' +
            '    After clearing the token, if you <a href="/test">test the ' +
            '    API request</a> again, you should go back to the auth flow.' +
            '</td></tr></table>')

# Create a liveBroadcast resource and set its title, scheduled start time,
# scheduled end time, and privacy status.


def insert_broadcast(youtube, videoPrivacyStatus, testNameValue):
    """
        Creates a liveBroadcast resource and set its title, scheduled start time,
        scheduled end time, and privacy status.
    """
    # create broadcast time
    time_delt1 = timedelta(days=0, hours=0, minutes=0, seconds=1)
    time_now = datetime.utcnow()
    future_date1 = time_now + time_delt1
    future_date_iso = future_date1.isoformat()
    # videoPrivacyStatus = "private"  # ToDo get this from request
    # testNameValue = "Python tests"  # ToDo get this from request
    videoPrivacyStatus = videoPrivacyStatus
    testNameValue = testNameValue
    #videoTitle = "Test Broadcast " + testNameValue + " " + future_date_iso
    videoTitle = testNameValue + " " + future_date_iso
    print(future_date_iso)

    request = youtube.liveBroadcasts().insert(
        part="snippet,contentDetails,statistics,status",
        body={
            "status": {
                # "privacyStatus": "private",
                # "privacyStatus": "public",
                "privacyStatus": videoPrivacyStatus,
                "selfDeclaredMadeForKids": False
            },
            "snippet": {
                "scheduledStartTime": future_date_iso,
                "title": videoTitle
            },
            "contentDetails": {
                "enableAutoStart": True,
                "enableAutoStop": True
            }
        }
    )

    insert_broadcast_response = request.execute()
    # print(insert_broadcast_response)

    snippet = insert_broadcast_response["snippet"]

    print("Broadcast '%s' with title '%s' was published at '%s'." % (
        insert_broadcast_response["id"], snippet["title"], snippet["publishedAt"]))

    return insert_broadcast_response["id"]


def insert_stream(youtube):
    """
        Creates a liveStream resource and set its title, format, and ingestion type.
        This resource describes the content that you are transmitting to YouTube.
    """

    request = youtube.liveStreams().insert(
        part="snippet,cdn,contentDetails,status",
        body={
            "cdn": {
                "frameRate": "variable",
                "ingestionType": "rtmp",
                "resolution": "variable"
            },
            "contentDetails": {
                "isReusable": False
            },
            "snippet": {
                "title": "A non reusable stream",
                "description": "A stream to be used once."
            }
        }
    )

    insert_stream_response = request.execute()
    # print(insert_stream_response)

    snippet = insert_stream_response["snippet"]
    cdn = insert_stream_response["cdn"]
    ingestionInfo = cdn["ingestionInfo"]

    print("Stream '%s' with title '%s' was inserted." % (
        insert_stream_response["id"], snippet["title"]))

    newStreamId = insert_stream_response["id"]
    newStreamName = ingestionInfo["streamName"]
    newStreamIngestionAddress = ingestionInfo["rtmpsIngestionAddress"]
    print("New stream id: ", newStreamId)
    print("New stream name: ", newStreamName)
    print("New stream ingestion address: ", newStreamIngestionAddress)
    newRtmpUrl = newStreamIngestionAddress + "/" + newStreamName
    print("New stream RTMP url: ", newRtmpUrl)

    stream_dict = {"newStreamId": newStreamId,
                   "newStreamName": newStreamName,
                   "newStreamIngestionAddress": newStreamIngestionAddress,
                   "newRtmpUrl": newRtmpUrl
                   }
    return stream_dict


def create_broadcast(videoPrivacyStatus, testNameValue, request):
    """
        Creates a broadcast with a livestream bound
    """

    # Opening JSON file
    """with open(credentials_file) as json_file:
        credentials = json.load(json_file)"""

    # Get current channel credetials
    channel_title = request.data.get("channel_title")
    credentials = json.loads(get_channel_credentials(request, channel_title))

    credentials = google.oauth2.credentials.Credentials(**credentials)

    youtube = googleapiclient.discovery.build(
        API_SERVICE_NAME, API_VERSION, credentials=credentials, cache_discovery=False)

    # Create broadcast
    new_broadcast_id = insert_broadcast(
        youtube, videoPrivacyStatus, testNameValue)

    # Create stream
    stream_dict = insert_stream(youtube)

    # Bind livestream and broadcast
    stream_dict['new_broadcast_id'] = new_broadcast_id
    stream_id = stream_dict['newStreamId']
    bind_broadcast(youtube, new_broadcast_id, stream_id)

    # Serializing json
    json_stream_dict = json.dumps(stream_dict)
    print(json_stream_dict)

    # return json_stream_dict
    return stream_dict


class CreateBroadcastView(APIView):
    #parser_classes = (MultiPartParser, FormParser)
    renderer_classes = [JSONRenderer]

    def post(self, request, *args, **kwargs):
        """
            Creates broadcast using API
        """

        print("Request: ", request)
        print("Request Data: ", request.data)
        print("Request Data Type: ", type(request.data))
        #videoPrivacyStatus = "private"
        #testNameValue = "Test1"
        videoPrivacyStatus = request.data.get("videoPrivacyStatus")
        testNameValue = request.data.get("testNameValue")
        print("videoPrivacyStatus: ", videoPrivacyStatus)
        print("testNameValue: ", testNameValue)

        stream_dict = create_broadcast(videoPrivacyStatus, testNameValue,request)
        #stream_dict = {"Hello":"Testing for now!"}
        print("stream_dict: ", stream_dict)

        return Response(stream_dict, status=status.HTTP_201_CREATED)


# Transitions a broadcast to complete status
def transition_broadcast(the_broadcast_id,request):

    # Opening JSON file
    """with open(credentials_file) as json_file:
        credentials = json.load(json_file)"""

    # Get current channel credetials
    channel_title = request.data.get("channel_title")
    credentials = json.loads(get_channel_credentials(request, channel_title))

    credentials = google.oauth2.credentials.Credentials(**credentials)

    youtube = googleapiclient.discovery.build(
        API_SERVICE_NAME, API_VERSION, credentials=credentials, cache_discovery=False)

    request = youtube.liveBroadcasts().transition(
        broadcastStatus="complete",
        id=the_broadcast_id,
        part="id,snippet,contentDetails,status"
    )

    broadcast_transition_response = request.execute()
    print("broadcast_transition_response: ", broadcast_transition_response)

    return broadcast_transition_response


class TransitionBroadcastView(APIView):
    #parser_classes = (MultiPartParser, FormParser)
    renderer_classes = [JSONRenderer]

    def post(self, request, *args, **kwargs):
        """
            Transitions broadcast using API
        """

        print("Request: ", request)
        print("Request Data: ", request.data)
        print("Request Data Type: ", type(request.data))
        #videoPrivacyStatus = "private"
        #testNameValue = "Test1"
        the_broadcast_id = request.data.get("the_broadcast_id")
        print("the_broadcast_id: ", the_broadcast_id)

        transition_response = transition_broadcast(the_broadcast_id,request)
        #transition_response = {"Hello":"Testing for now!"}
        print("transition_response: ", transition_response)

        return Response(transition_response, status=status.HTTP_200_OK)


class PlaylistItemsInsertView(APIView):
    """
        Handles requests to insert a video into a youtube channel
        playlist
    """
    renderer_classes = [JSONRenderer]

    def post(self, request, *args, **kwargs):
        try:
            #print("Request: ", request)
            print("Request Data: ", request.data)

            # Get the video and playlist data
            the_video_id = request.data.get("videoId")
            the_playlist_id = request.data.get("playlistId")
            print("the_video_id: ", the_video_id)
            print("the_playlist_id: ", the_playlist_id)

            # Create youtube object
            """with open(credentials_file) as json_file:
                credentials = json.load(json_file)"""

            # Get current channel credetials
            channel_title = request.data.get("channel_title")
            credentials = json.loads(get_channel_credentials(request, channel_title))

            credentials = google.oauth2.credentials.Credentials(**credentials)

            youtube = googleapiclient.discovery.build(
                API_SERVICE_NAME, API_VERSION, credentials=credentials, cache_discovery=False)

            # Make the insert request
            request = youtube.playlistItems().insert(
                part="snippet",
                body={
                    "snippet": {
                        "playlistId": the_playlist_id,
                        "position": 0,
                        "resourceId": {
                            "kind": "youtube#video",
                            "videoId": the_video_id
                        }
                    }
                }
            )
            response = request.execute()

            return Response(response, status=status.HTTP_200_OK)

        except Exception as err:
            print("Error while inserting video into playlist: " + str(err))
            return Response(str(err), status=status.HTTP_400_BAD_REQUEST)


def get_user_playlists_from_db(current_user_id):
    """
      Gets all playlists for the current user from a db,
      the playlist has to be enabled for the user.
      current_user_id is a unique identifier for the
      current user.
    """

    # set up mongodb access
    mongo_client = pymongo.MongoClient(os.getenv("DATABASE_HOST"))
    db = mongo_client[os.getenv("DATABASE_NAME")]
    collection = db["user_youtube_playlists"]

    # Query to get enabled playlists for user
    user_query = {"user_id": "Walter", "playlist_enabled": True}

    # Get the playlists documents
    playlists_documents = collection.find(user_query)

    return playlists_documents


def get_todays_playlist_title():
    """
        Creates the title of current day's playlist.
    """
    # Construct playlist title using date
    current_date_and_time = datetime.now()

    date_string = current_date_and_time.strftime('%d %B %Y')
    #print("date_string: ",date_string)

    playlist_title = date_string + " Daily Playlist"
    #print("playlist_title: ",playlist_title)

    return playlist_title

def fetch_playlists_with_pagination(youtube_object):
    """
        Fetches playlists with the help of pagination
    """
    fetch_playlists = True
    playlists = []
    page_token=""
    #count = 0

    # Fetch the playlists
    while fetch_playlists:
        request = youtube_object.playlists().list(
            part="snippet,contentDetails",
            maxResults=50,
            mine=True,
            pageToken=page_token
        )
        response = request.execute()
        #print("FetchPlaylistsView response: ", response)
        #print("FetchPlaylistsView response: ", count)
        #count = count + 1

        # Get next page token
        if "nextPageToken" in response.keys():
            page_token = response['nextPageToken']
        else:
            fetch_playlists = False

        # Add current page's playlists
        playlists.extend(response['items'])


    # Return fetched playlists
    return playlists


class FetchPlaylistsView(APIView):
    """
        Handles requests to get the current youtube channel's
        playlists
    """

    renderer_classes = [JSONRenderer]

    def post(self, request, *args, **kwargs):
        try:
            print("Request: ", request)

            # Create youtube object
            """with open(credentials_file) as json_file:
                credentials = json.load(json_file)"""

            # Get current channel credetials
            channel_title = request.data.get("channel_title")
            credentials = json.loads(get_channel_credentials(request, channel_title))

            credentials = google.oauth2.credentials.Credentials(**credentials)

            youtube = googleapiclient.discovery.build(
                API_SERVICE_NAME, API_VERSION, credentials=credentials, cache_discovery=False)

            """# Fetch the playlists
            request = youtube.playlists().list(
                part="snippet,contentDetails",
                maxResults=5,
                mine=True,
                pageToken=""
            )
            response = request.execute()
            print("FetchPlaylistsView response: ", response)

            # Extract playlist id and names from data
            playlists = response['items']"""

            # Fetch all playlists with pagination
            playlists = fetch_playlists_with_pagination(youtube)

            # playlist id and title dictionary
            id_title_dict = {}
            todays_playlist_dict = {}

            # today's playlist title
            todays_playlist_title = get_todays_playlist_title()

            # Current channel title
            channel_title = ""
            # Iterating through the json list
            for playlist in playlists:
                id = playlist["id"]
                #print("Playlist ID = ",id)
                title = playlist["snippet"]["title"]
                #print("Playlist Title = ",title)

                # Add playlist to dictionary
                #id_title_dict[id] = title

                # Filter out daily playlists
                if "Daily Playlist" not in title:
                    id_title_dict[id] = title
                elif todays_playlist_title == title:
                    todays_playlist_dict["todays_playlist_id"] = id
                    todays_playlist_dict["todays_playlist_title"] = title

                # Current channel title
                channel_title = playlist["snippet"]["channelTitle"]

            print("id_title_dict: ", id_title_dict)

            # Dummy dictionary for testing
            #id_title_dict = { 'PL5G8ZO9YbJUkLn8d7cxEe-lm8BES7PMK3': 'information-retrieval', 'PL5G8ZO9YbJUlTepJf2K9DfaPQXd5d9mhc': 'discord', 'PL5G8ZO9YbJUmRADmMY7ytFNbyRm6Ao-c_': 'R language', 'PL5G8ZO9YbJUk4ZQXkCPst4IKckocKowAZ': 'Playing', 'PL5G8ZO9YbJUkuBPYE2ohhg8CC1kooYhyp': 'physics', 'PL5G8ZO9YbJUkNANUsQkG04KA09GRN5pBp': 'information retrieval', 'PL5G8ZO9YbJUlO_JuUn5zWvRTvqjb_2DD4': 'HTML', 'PL5G8ZO9YbJUkU-Wwtv0mvQ77TBRBaqp_T': 'calendly', 'PL5G8ZO9YbJUl8Cpmo62u3N6JfeONtFe6Q': 'React', 'PL5G8ZO9YbJUmzHnk0QJXRqu2NiSFF92_m': 'Git', 'PL5G8ZO9YbJUkFfO7Mu468lbeXDN2tuMYh': 'Algorithm analysis', 'PL5G8ZO9YbJUnUuCt2WKvE3nU7EB68R38R': 'stm32', 'PL5G8ZO9YbJUnm8iK6XwF3JYV4u0HerrNI': 'stm32', 'PL5G8ZO9YbJUngdOaufnpudnL_0J443fXu': 'music', 'PL5G8ZO9YbJUmWFU5XVqrR6KoneVQdPIPO': 'Biology', 'PL5G8ZO9YbJUndgIo48rpKnCxkAAx-9bEt': 'nigerian music', 'PL5G8ZO9YbJUnUPbd7GGqgvVfsccrFofhz': 'youtubeapi', 'PL5G8ZO9YbJUn01LnVyo0BJPBEbSGlaKwk': 'reddis', 'PL5G8ZO9YbJUkxaJSLikGdVVxDRGaZQK7D': 'ffmpeg', 'PL5G8ZO9YbJUkF89UXv_AEl_vSMvjcOZZP': 'brython', 'PL5G8ZO9YbJUk6F0h9yFJWRpwciCTb6jMS': 'regex', 'PL5G8ZO9YbJUlF3TMfknd7EI0QLEZlJn5c': 'clickup', 'PL5G8ZO9YbJUkI203F03aONzr2A1J-awXa': 'films', 'PL5G8ZO9YbJUm7C1TQHfqKENHrejzY7Cn6': 'CASE tools', 'PL5G8ZO9YbJUnTnS-YITmzBus4wuowuQo8': 'browser-extensions' }
            #id_title_dict = {'PLtuQzcUOuJ4eOoBUj6Rx3sA4REJAXgTiz': 'Test Playlist 1'}

            """# Get playlists in user db list and in youtube
            new_user_id = "Walter"
            user_db_playlists = get_user_playlists_from_db(new_user_id)
            filtered_playlists = {}
            for playlist in user_db_playlists:
                print(playlist["playlist_title"])
                if playlist["playlist_id"] in id_title_dict.keys():
                    filtered_playlists[playlist["playlist_id"]] = id_title_dict[playlist["playlist_id"]]

            print("filtered_playlists: ", filtered_playlists)
            return Response(filtered_playlists, status=status.HTTP_200_OK)"""

            # add channel title
            print("channel_title: ", channel_title)

            # get daily playlist information from db

            # Dictionary with all necessary data
            youtube_details = {'channel_title': channel_title,
                               'id_title_dict': id_title_dict,
                               'todays_playlist_dict': todays_playlist_dict}
            return Response(youtube_details, status=status.HTTP_200_OK)

            # return Response(id_title_dict, status=status.HTTP_200_OK)
        except Exception as err:
            print("Error while getting playlists: " + str(err))
            return Response(str(err), status=status.HTTP_400_BAD_REQUEST)


def fetch_user_playlists():
    """
        Handles requests to get the current youtube channel's
        playlists
    """

    try:
        # Create youtube object
        with open(credentials_file) as json_file:
            credentials = json.load(json_file)

        credentials = google.oauth2.credentials.Credentials(**credentials)

        youtube = googleapiclient.discovery.build(
            API_SERVICE_NAME, API_VERSION, credentials=credentials, cache_discovery=False)

        """# Fetch the playlists
        request = youtube.playlists().list(
            part="snippet,contentDetails",
            maxResults=25,
            mine=True
        )
        response = request.execute()
        print(response)

        # Extract playlist id and names from data
        playlists = response['items']"""

        # Fetch all playlists with pagination
        playlists = fetch_playlists_with_pagination(youtube)

        # playlist id and title dictionary
        id_title_dict = {}
        todays_playlist_dict = {}
        # today's playlist title
        todays_playlist_title = get_todays_playlist_title()

        # Current channel title
        channel_title = ""
        # Iterating through the json list
        for playlist in playlists:
            id = playlist["id"]
            #print("Playlist ID = ",id)
            title = playlist["snippet"]["title"]
            #print("Playlist Title = ",title)

            # Add playlist to dictionary
            #id_title_dict[id] = title
            # Filter out daily playlists
            if "Daily Playlist" not in title:
                id_title_dict[id] = title
            elif todays_playlist_title == title:
                todays_playlist_dict["todays_playlist_id"] = id
                todays_playlist_dict["todays_playlist_title"] = title

            # Current channel title
            channel_title = playlist["snippet"]["channelTitle"]

        print("id_title_dict: ", id_title_dict)

        # Dummy dictionary for testing
        #id_title_dict = { 'PL5G8ZO9YbJUkLn8d7cxEe-lm8BES7PMK3': 'information-retrieval', 'PL5G8ZO9YbJUlTepJf2K9DfaPQXd5d9mhc': 'discord', 'PL5G8ZO9YbJUmRADmMY7ytFNbyRm6Ao-c_': 'R language', 'PL5G8ZO9YbJUk4ZQXkCPst4IKckocKowAZ': 'Playing', 'PL5G8ZO9YbJUkuBPYE2ohhg8CC1kooYhyp': 'physics', 'PL5G8ZO9YbJUkNANUsQkG04KA09GRN5pBp': 'information retrieval', 'PL5G8ZO9YbJUlO_JuUn5zWvRTvqjb_2DD4': 'HTML', 'PL5G8ZO9YbJUkU-Wwtv0mvQ77TBRBaqp_T': 'calendly', 'PL5G8ZO9YbJUl8Cpmo62u3N6JfeONtFe6Q': 'React', 'PL5G8ZO9YbJUmzHnk0QJXRqu2NiSFF92_m': 'Git', 'PL5G8ZO9YbJUkFfO7Mu468lbeXDN2tuMYh': 'Algorithm analysis', 'PL5G8ZO9YbJUnUuCt2WKvE3nU7EB68R38R': 'stm32', 'PL5G8ZO9YbJUnm8iK6XwF3JYV4u0HerrNI': 'stm32', 'PL5G8ZO9YbJUngdOaufnpudnL_0J443fXu': 'music', 'PL5G8ZO9YbJUmWFU5XVqrR6KoneVQdPIPO': 'Biology', 'PL5G8ZO9YbJUndgIo48rpKnCxkAAx-9bEt': 'nigerian music', 'PL5G8ZO9YbJUnUPbd7GGqgvVfsccrFofhz': 'youtubeapi', 'PL5G8ZO9YbJUn01LnVyo0BJPBEbSGlaKwk': 'reddis', 'PL5G8ZO9YbJUkxaJSLikGdVVxDRGaZQK7D': 'ffmpeg', 'PL5G8ZO9YbJUkF89UXv_AEl_vSMvjcOZZP': 'brython', 'PL5G8ZO9YbJUk6F0h9yFJWRpwciCTb6jMS': 'regex', 'PL5G8ZO9YbJUlF3TMfknd7EI0QLEZlJn5c': 'clickup', 'PL5G8ZO9YbJUkI203F03aONzr2A1J-awXa': 'films', 'PL5G8ZO9YbJUm7C1TQHfqKENHrejzY7Cn6': 'CASE tools', 'PL5G8ZO9YbJUnTnS-YITmzBus4wuowuQo8': 'browser-extensions' }
        #id_title_dict = {'PLtuQzcUOuJ4eOoBUj6Rx3sA4REJAXgTiz': 'Test Playlist 1'}

        """# Get playlists in user db list and in youtube
        new_user_id = "Walter"
        user_db_playlists = get_user_playlists_from_db(new_user_id)
        filtered_playlists = {}
        for playlist in user_db_playlists:
            print(playlist["playlist_title"])
            if playlist["playlist_id"] in id_title_dict.keys():
                filtered_playlists[playlist["playlist_id"]] = id_title_dict[playlist["playlist_id"]]

        print("filtered_playlists: ", filtered_playlists)
        return Response(filtered_playlists, status=status.HTTP_200_OK)"""

        # add channel title
        print("channel_title: ", channel_title)

        # Dictionary with all necessary data
        youtube_details = {'channel_title': channel_title,
                           'id_title_dict': id_title_dict,
                            'todays_playlist_dict': todays_playlist_dict}
        return youtube_details

    except Exception as err:
        error_msg = "Error while getting playlists: " + str(err)
        print(error_msg)
        raise Exception(error_msg)


def insert_video_into_playlist(the_video_id, the_playlist_id):
    """
        Handles requests to insert a video into a youtube channel
        playlist
    """
    try:
        print("the_video_id: ", the_video_id)
        print("the_playlist_id: ", the_playlist_id)

        # Create youtube object
        with open(credentials_file) as json_file:
            credentials = json.load(json_file)

        credentials = google.oauth2.credentials.Credentials(**credentials)

        youtube = googleapiclient.discovery.build(
            API_SERVICE_NAME, API_VERSION, credentials=credentials, cache_discovery=False)

        # Make the insert request
        request = youtube.playlistItems().insert(
            part="snippet",
            body={
                "snippet": {
                    "playlistId": the_playlist_id,
                    "position": 0,
                    "resourceId": {
                        "kind": "youtube#video",
                        "videoId": the_video_id
                    }
                }
            }
        )
        response = request.execute()

        return True

    except Exception as err:
        error_msg = "Error while inserting video into playlist: " + str(err)
        print(error_msg)
        raise Exception(error_msg)


def create_playlist(playlist_title, playlist_description, playlist_privacy_status, request):
    """
        Handles requests to create a playlist
    """
    try:
        print("playlist_title: ", playlist_title)
        print("playlist_description: ", playlist_description)
        print("playlist_privacy_status: ", playlist_privacy_status)

        # Create youtube object
        """with open(credentials_file) as json_file:
            credentials = json.load(json_file)"""

        # Get current channel credetials
        channel_title = request.data.get("channel_title")
        credentials = json.loads(get_channel_credentials(request, channel_title))

        credentials = google.oauth2.credentials.Credentials(**credentials)

        youtube = googleapiclient.discovery.build(
            API_SERVICE_NAME, API_VERSION, credentials=credentials, cache_discovery=False)


        # Check if a playlist with provided title exists
        # Fetch all playlists with pagination
        playlists = fetch_playlists_with_pagination(youtube)
        # Iterating through the json list
        for playlist in playlists:
            title = playlist["snippet"]["title"]

            if playlist_title.lower() == title.lower():
                # Duplicate record was found
                message = "A playlist with the title "+playlist_title+" already exists!"
                raise Exception(message)


        # Make the insert request
        request = youtube.playlists().insert(
            part="snippet,status",
            body={
                "snippet": {
                    "title": playlist_title,
                    "description": playlist_description,
                    "tags": [
                        "sample playlist",
                        "API call"
                    ],
                    "defaultLanguage": "en"
                },
                "status": {
                    "privacyStatus": playlist_privacy_status
                }
            }
        )
        response = request.execute()

        #return True
        return response

    except Exception as err:
        error_msg = "Error while creating playlist: " + str(err)
        print(error_msg)
        raise Exception(error_msg)


class CreatePlaylistView(APIView):
    """
        API to handles requests to create a playlists
    """

    renderer_classes = [JSONRenderer]

    def post(self, request, *args, **kwargs):
        try:
            # Get the new playlist information
            title = request.data.get("new_playlist_title")
            description = request.data.get("new_playlist_description")
            privacy = request.data.get("new_playlist_privacy")

            # Check if playlist already exists

            # create playlist
            response = create_playlist(title, description, privacy,request)
            #print("Playlist creation response: ",response)

            if response:
                msg = {'CreatePlaylistResponse': "Playlist created"}
                return Response(msg, status=status.HTTP_200_OK)
            else:
                msg = {'CreatePlaylistResponse': "Failed to create playlist"}
                return Response(error_msg, status=status.HTTP_400_BAD_REQUEST)

        except Exception as err:
            error_msg = "Error while creating playlist: " + str(err)
            print(error_msg)

            if "already exists!" in error_msg:
                return Response(error_msg, status=status.HTTP_409_CONFLICT)
            else:
                return Response(error_msg, status=status.HTTP_400_BAD_REQUEST)

class FetchPlaylistsViewV2(APIView):
    """
        Handles requests to get the current youtube channel's
        playlists,sends the playlists as a list, earlier version
        sends a dictionary
    """

    renderer_classes = [JSONRenderer]

    def post(self, request, *args, **kwargs):
        try:
            print("Request: ", request)

            # Create youtube object
            """with open(credentials_file) as json_file:
                credentials = json.load(json_file)"""

            # Get current channel credetials
            channel_title = request.data.get("channel_title")
            credentials = json.loads(get_channel_credentials(request, channel_title))

            credentials = google.oauth2.credentials.Credentials(**credentials)

            youtube = googleapiclient.discovery.build(
                API_SERVICE_NAME, API_VERSION, credentials=credentials, cache_discovery=False)

            # Fetch all playlists with pagination
            playlists = fetch_playlists_with_pagination(youtube)

            # playlist id and title dictionary
            id_title_dict = {}
            todays_playlist_dict = {}
            id_title_list = []

            # today's playlist title
            todays_playlist_title = get_todays_playlist_title()

            # Current channel title
            channel_title = ""
            # Iterating through the json list
            for playlist in playlists:
                id = playlist["id"]
                #print("Playlist ID = ",id)
                title = playlist["snippet"]["title"]
                #print("Playlist Title = ",title)


                # Add playlist to dictionary
                #id_title_dict[id] = title

                # Filter out daily playlists
                if "Daily Playlist" not in title:
                    #id_title_dict[id] = title

                    temp_dict = {}
                    temp_dict["playlist_id"] = id
                    temp_dict["playlist_title"] = title
                    id_title_list.append(temp_dict)
                elif todays_playlist_title == title:
                    todays_playlist_dict["todays_playlist_id"] = id
                    todays_playlist_dict["todays_playlist_title"] = title

                # Current channel title
                channel_title = playlist["snippet"]["channelTitle"]

            print("id_title_dict: ", id_title_dict)

            # Dummy dictionary for testing
            #id_title_dict = { 'PL5G8ZO9YbJUkLn8d7cxEe-lm8BES7PMK3': 'information-retrieval', 'PL5G8ZO9YbJUlTepJf2K9DfaPQXd5d9mhc': 'discord', 'PL5G8ZO9YbJUmRADmMY7ytFNbyRm6Ao-c_': 'R language', 'PL5G8ZO9YbJUk4ZQXkCPst4IKckocKowAZ': 'Playing', 'PL5G8ZO9YbJUkuBPYE2ohhg8CC1kooYhyp': 'physics', 'PL5G8ZO9YbJUkNANUsQkG04KA09GRN5pBp': 'information retrieval', 'PL5G8ZO9YbJUlO_JuUn5zWvRTvqjb_2DD4': 'HTML', 'PL5G8ZO9YbJUkU-Wwtv0mvQ77TBRBaqp_T': 'calendly', 'PL5G8ZO9YbJUl8Cpmo62u3N6JfeONtFe6Q': 'React', 'PL5G8ZO9YbJUmzHnk0QJXRqu2NiSFF92_m': 'Git', 'PL5G8ZO9YbJUkFfO7Mu468lbeXDN2tuMYh': 'Algorithm analysis', 'PL5G8ZO9YbJUnUuCt2WKvE3nU7EB68R38R': 'stm32', 'PL5G8ZO9YbJUnm8iK6XwF3JYV4u0HerrNI': 'stm32', 'PL5G8ZO9YbJUngdOaufnpudnL_0J443fXu': 'music', 'PL5G8ZO9YbJUmWFU5XVqrR6KoneVQdPIPO': 'Biology', 'PL5G8ZO9YbJUndgIo48rpKnCxkAAx-9bEt': 'nigerian music', 'PL5G8ZO9YbJUnUPbd7GGqgvVfsccrFofhz': 'youtubeapi', 'PL5G8ZO9YbJUn01LnVyo0BJPBEbSGlaKwk': 'reddis', 'PL5G8ZO9YbJUkxaJSLikGdVVxDRGaZQK7D': 'ffmpeg', 'PL5G8ZO9YbJUkF89UXv_AEl_vSMvjcOZZP': 'brython', 'PL5G8ZO9YbJUk6F0h9yFJWRpwciCTb6jMS': 'regex', 'PL5G8ZO9YbJUlF3TMfknd7EI0QLEZlJn5c': 'clickup', 'PL5G8ZO9YbJUkI203F03aONzr2A1J-awXa': 'films', 'PL5G8ZO9YbJUm7C1TQHfqKENHrejzY7Cn6': 'CASE tools', 'PL5G8ZO9YbJUnTnS-YITmzBus4wuowuQo8': 'browser-extensions' }
            #id_title_dict = {'PLtuQzcUOuJ4eOoBUj6Rx3sA4REJAXgTiz': 'Test Playlist 1'}

            # add channel title
            print("channel_title: ", channel_title)

            # get daily playlist information from db

            # Dictionary with all necessary data
            youtube_details = {'channel_title': channel_title,
                               'id_title_list': id_title_list,
                               'todays_playlist_dict': todays_playlist_dict}
            return Response(youtube_details, status=status.HTTP_200_OK)

            # return Response(id_title_dict, status=status.HTTP_200_OK)
        except Exception as err:
            print("Error while getting playlists: " + str(err))
            return Response(str(err), status=status.HTTP_400_BAD_REQUEST)


class FetchChannels(APIView):
    """
        Gets Channels information
    """

    renderer_classes = [JSONRenderer]

    def get(self, request, *args, **kwargs):
        try:
            #get_channel_details(request, "UX Live from uxlivinglab")
            """current_credentials = get_channel_credentials(request, "UX Live from uxlivinglab")
            print("current_credentials: ",current_credentials)"""

            all_channels = ChannelsRecord.objects.all()
            channels_list = []

            for channel in all_channels.iterator():
                print("Channel id: ", channel.channel_id)
                print("Channel title: ", channel.channel_title)
                #print("Channel credentials: ", channel.channel_credentials)
                temp_dict = {}
                temp_dict["channel_id"] = channel.channel_id
                temp_dict["channel_title"] = channel.channel_title
                channels_list.append(temp_dict)

            # Dictionary with all necessary data
            channels_details = {'channels_list': channels_list}

            return Response(channels_details, status=status.HTTP_200_OK)
        except Exception as err:
            print("Error while getting channels: " + str(err))
            return Response(str(err), status=status.HTTP_400_BAD_REQUEST)