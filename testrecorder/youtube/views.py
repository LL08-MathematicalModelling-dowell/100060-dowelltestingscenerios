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

# When running locally, disable OAuthlib's HTTPs verification.
    # ACTION ITEM for developers:
    #     When running in production *do not* leave this option enabled.
os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'

credentials_file = settings.BASE_DIR+'/youtube/credentials.json'

# This variable specifies the name of a file that contains the OAuth 2.0
# information for this application, including its client_id and client_secret.
#CLIENT_SECRETS_FILE = "client_secret.json"

CLIENT_SECRETS_FILE = settings.BASE_DIR+'/youtube/client_secret.json'

# This OAuth 2.0 access scope allows for full read/write access to the
# authenticated user's account and requires requests to use an SSL connection.
SCOPES = ['https://www.googleapis.com/auth/youtube.force-ssl', 'openid', 'https://www.googleapis.com/auth/userinfo.profile',
          'https://www.googleapis.com/auth/youtube.force-ssl', 'https://www.googleapis.com/auth/userinfo.email']
API_SERVICE_NAME = 'youtube'
API_VERSION = 'v3'


def index(request):
    return HttpResponse(print_index_table())


def test_api_request(request):
    #if 'credentials' not in request.session:
        #return flask.redirect('authorize')

        #response = redirect('/authorize/')
        #return response

    if not request.session.get('credentials'):
        response = redirect('authorize')
        return response

    # Load credentials from the session.
    credentials = google.oauth2.credentials.Credentials(
        **request.session.get('credentials'))

    youtube = googleapiclient.discovery.build(
        API_SERVICE_NAME, API_VERSION, credentials=credentials,cache_discovery=False)

    channel = youtube.channels().list(mine=True, part='snippet').execute()

    # Save credentials back to session in case access token was refreshed.
    # ACTION ITEM: In a production app, you likely want to save these
    #              credentials in a persistent database instead.
    request.session['credentials'] = credentials_to_dict(credentials)

    # Save credentials in json file
    credentials_dict = credentials_to_dict(credentials)
    with open(credentials_file, "w") as write_file:
        json.dump(credentials_dict, write_file, indent=4)

    #return flask.jsonify(**channel)
    #json_channel = json.dumps(channel, indent = 4)
    json_channel = json.dumps(channel)
    print(json_channel)
    return HttpResponse(json_channel)

# Create a liveBroadcast resource and set its title, scheduled start time,
# scheduled end time, and privacy status.


def insert_broadcast(youtube):
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


# Create a liveStream resource and set its title, format, and ingestion type.
# This resource describes the content that you are transmitting to YouTube.
def insert_stream(youtube):
    """request = youtube.liveStreams().insert(
        part="snippet,contentDetails,statistics,status",
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
    )"""

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

# Bind the broadcast to the video stream. By doing so, you link the video that
# you will transmit to YouTube to the broadcast that the video is for.


def bind_broadcast(youtube, broadcast_id, stream_id):
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
    """if 'credentials' not in flask.session:
        return flask.redirect('authorize')"""

    # Opening JSON file
    with open('credentials.json') as json_file:
        credentials = json.load(json_file)
        """flask.session['credentials'] = credentials

        # Print the type of data variable
        print("Type:", type(credentials))

    # Load credentials from the session.
    credentials = google.oauth2.credentials.Credentials(
        **flask.session['credentials'])"""

    credentials = google.oauth2.credentials.Credentials(**credentials)

    youtube = googleapiclient.discovery.build(
        API_SERVICE_NAME, API_VERSION, credentials=credentials,cache_discovery=False)

    # create broadcast time
    time_delt1 = timedelta(days=0, hours=0, minutes=5)
    # time_now = datetime.now()
    time_now = datetime.utcnow()
    future_date1 = time_now + time_delt1
    future_date_iso = future_date1.isoformat()
    print(future_date_iso)

    """# Create broad cast
    request = youtube.liveBroadcasts().insert(
        part="snippet,contentDetails,statistics,status",
        body={
            "contentDetails": {
                "enableAutoStart": True
            },
            "snippet": {
                "scheduledStartTime": future_date_iso,
                "title": "Walters test Broadcast 1 12/04/2022",
                "channelId": "UCIdKn6oPpnjySBnpWgWcg5w"
            },
            "status": {
                "privacyStatus": "private",
                "selfDeclaredMadeForKids": False
            }
        }
    )
    response = request.execute()

    print(response)"""

    # Create broadcast
    new_broadcast_id = insert_broadcast(youtube)
    # new_broadcast_id="insert_broadcast(youtube)"

    # Create stream
    stream_dict = insert_stream(youtube)

    # Bind livestream and broadcast
    stream_dict['new_broadcast_id'] = new_broadcast_id
    stream_id = stream_dict['newStreamId']
    bind_broadcast(youtube, new_broadcast_id, stream_id)

    # Save credentials back to session in case access token was refreshed.
    # ACTION ITEM: In a production app, you likely want to save these
    #              credentials in a persistent database instead.
    #flask.session['credentials'] = credentials_to_dict(credentials)

    """new_broadcast_dict = {"new_broadcast_id": new_broadcast_id,
                          "new_stream_id": new_stream_id
                          }"""
    #return flask.jsonify(**stream_dict)

    # Serializing json
    json_stream_dict = json.dumps(stream_dict)
    print(json_stream_dict)

    #return json_stream_dict

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
    print("Reversed URL: ",url)

    #flow.redirect_uri = flask.url_for('oauth2callback', _external=True)
    flow.redirect_uri = url

    authorization_url, state = flow.authorization_url(
        # Enable offline access so that you can refresh an access token without
        # re-prompting the user for permission. Recommended for web server apps.
        access_type='offline',
        # Enable incremental authorization. Recommended as a best practice.
        include_granted_scopes='true')

    # Store the state so the callback can verify the auth server response.
    request.session['state'] = state

    #return flask.redirect(authorization_url)
    request.session['authorization_url'] = authorization_url
    print("authorization_url: ",authorization_url)
    response = redirect(authorization_url)
    return response


def oauth2callback(request):
    print("Request: ",request)
    print("Request.GET: ",request.GET)
    print("request.GET.keys(): ",request.GET.keys())
    currentUrl = request.get_full_path()
    print("request currentUrl: ",currentUrl)
    # Specify the state when creating the flow in the callback so that it can
    # verified in the authorization server response.
    state = request.session['state']

    flow = google_auth_oauthlib.flow.Flow.from_client_secrets_file(
        CLIENT_SECRETS_FILE, scopes=SCOPES, state=state)
    #flow.redirect_uri = flask.url_for('oauth2callback', _external=True)
    url = reverse('oauth2callback', request=request)
    print("Reversed URL: ",url)
    flow.redirect_uri = url

    # Use the authorization server's response to fetch the OAuth 2.0 tokens.
    #authorization_response = flask.request.url
    request_url = request.session.get('authorization_url')
    #authorization_response = request.url
    #authorization_response = request_url
    authorization_response = currentUrl
    flow.fetch_token(authorization_response=authorization_response)

    # Store credentials in the session.
    # ACTION ITEM: In a production app, you likely want to save these
    #              credentials in a persistent database instead.
    credentials = flow.credentials
    print("OAUTH credentials: ", credentials)
    request.session['credentials'] = credentials_to_dict(credentials)

    #return flask.redirect(flask.url_for('test_api_request'))

    response = redirect('test_api_request')
    return response


def revoke(request):
    """if 'credentials' not in flask.session:
        return ('You need to <a href="/authorize">authorize</a> before ' +
                'testing the code to revoke credentials.')"""

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
    """if 'credentials' in flask.session:
        del flask.session['credentials']"""

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
def insert_broadcast(youtube,videoPrivacyStatus,testNameValue):
    # create broadcast time
    time_delt1 = timedelta(days=0, hours=0, minutes=0,seconds=1)
    time_now = datetime.utcnow()
    future_date1 = time_now + time_delt1
    future_date_iso = future_date1.isoformat()
    #videoPrivacyStatus = "private"  # ToDo get this from request
    #testNameValue = "Python tests"  # ToDo get this from request
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
    #print(insert_broadcast_response)

    snippet = insert_broadcast_response["snippet"]

    print("Broadcast '%s' with title '%s' was published at '%s'." % (
        insert_broadcast_response["id"], snippet["title"], snippet["publishedAt"]))

    return insert_broadcast_response["id"]


# Create a liveStream resource and set its title, format, and ingestion type.
# This resource describes the content that you are transmitting to YouTube.
def insert_stream(youtube):

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
    #print(insert_stream_response)

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

# Creates a broadcast with a livestream bound
def create_broadcast(videoPrivacyStatus,testNameValue):

    # Opening JSON file
    #with open('./credentials.json') as json_file:
    with open(credentials_file) as json_file:
        credentials = json.load(json_file)

    credentials = google.oauth2.credentials.Credentials(**credentials)

    youtube = googleapiclient.discovery.build(
        API_SERVICE_NAME, API_VERSION, credentials=credentials,cache_discovery=False)

    # Create broadcast
    new_broadcast_id = insert_broadcast(youtube,videoPrivacyStatus,testNameValue)

    # Create stream
    stream_dict = insert_stream(youtube)

    # Bind livestream and broadcast
    stream_dict['new_broadcast_id'] = new_broadcast_id
    stream_id = stream_dict['newStreamId']
    bind_broadcast(youtube, new_broadcast_id, stream_id)

    # Serializing json
    json_stream_dict = json.dumps(stream_dict)
    print(json_stream_dict)

    #return json_stream_dict
    return stream_dict

# Create broadcast using API
class CreateBroadcastView(APIView):
    #parser_classes = (MultiPartParser, FormParser)
    renderer_classes = [JSONRenderer]

    def post(self, request, *args, **kwargs):
        print("Request: ",request)
        print("Request Data: ",request.data)
        print("Request Data Type: ",type(request.data))
        #videoPrivacyStatus = "private"
        #testNameValue = "Test1"
        videoPrivacyStatus = request.data.get("videoPrivacyStatus")
        testNameValue = request.data.get("testNameValue")
        print("videoPrivacyStatus: ",videoPrivacyStatus)
        print("testNameValue: ",testNameValue)

        stream_dict = create_broadcast(videoPrivacyStatus,testNameValue)
        #stream_dict = {"Hello":"Testing for now!"}
        print("stream_dict: ",stream_dict)

        return Response(stream_dict, status=status.HTTP_201_CREATED)


# Transitions a broadcast to complete status
def transition_broadcast(the_broadcast_id):

    # Opening JSON file
    with open(credentials_file) as json_file:
        credentials = json.load(json_file)

    credentials = google.oauth2.credentials.Credentials(**credentials)

    youtube = googleapiclient.discovery.build(
        API_SERVICE_NAME, API_VERSION, credentials=credentials,cache_discovery=False)

    request = youtube.liveBroadcasts().transition(
        broadcastStatus="complete",
        id=the_broadcast_id,
        part="id,snippet,contentDetails,status"
    )

    broadcast_transition_response = request.execute()
    print("broadcast_transition_response: ",broadcast_transition_response)

    return broadcast_transition_response

# Transition broadcast using API
class TransitionBroadcastView(APIView):
    #parser_classes = (MultiPartParser, FormParser)
    renderer_classes = [JSONRenderer]

    def post(self, request, *args, **kwargs):
        print("Request: ",request)
        print("Request Data: ",request.data)
        print("Request Data Type: ",type(request.data))
        #videoPrivacyStatus = "private"
        #testNameValue = "Test1"
        the_broadcast_id = request.data.get("the_broadcast_id")
        print("the_broadcast_id: ",the_broadcast_id)

        transition_response = transition_broadcast(the_broadcast_id)
        #transition_response = {"Hello":"Testing for now!"}
        print("transition_response: ",transition_response)

        return Response(transition_response, status=status.HTTP_200_OK)

