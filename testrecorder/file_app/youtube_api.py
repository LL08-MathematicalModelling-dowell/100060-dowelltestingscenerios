# -*- coding: utf-8 -*-

import os
import requests

import google.oauth2.credentials
import google_auth_oauthlib.flow
import googleapiclient.discovery
from datetime import datetime, timezone
from datetime import timedelta
import json
from django.conf import settings

credentials_file = settings.BASE_DIR+'/file_app/credentials.json'

# This variable specifies the name of a file that contains the OAuth 2.0
# information for this application, including its client_id and client_secret.
CLIENT_SECRETS_FILE = "client_secret.json"

# This OAuth 2.0 access scope allows for full read/write access to the
# authenticated user's account and requires requests to use an SSL connection.
SCOPES = ['https://www.googleapis.com/auth/youtube.force-ssl', 'openid', 'https://www.googleapis.com/auth/userinfo.profile',
          'https://www.googleapis.com/auth/youtube.force-ssl', 'https://www.googleapis.com/auth/userinfo.email']
API_SERVICE_NAME = 'youtube'
API_VERSION = 'v3'


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
    videoTitle = "Test Broadcast " + testNameValue + " " + future_date_iso
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
                "enableAutoStart": True
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


# Creates a broadcast with a livestream bound
def create_broadcast(videoPrivacyStatus,testNameValue):

    # Opening JSON file
    #with open('./credentials.json') as json_file:
    with open(credentials_file) as json_file:
        credentials = json.load(json_file)

    credentials = google.oauth2.credentials.Credentials(**credentials)

    youtube = googleapiclient.discovery.build(
        API_SERVICE_NAME, API_VERSION, credentials=credentials)

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

    return json_stream_dict


# Transitions a broadcast to complete status
def transition_broadcast(the_broadcast_id):

    # Opening JSON file
    with open('credentials.json') as json_file:
        credentials = json.load(json_file)

    credentials = google.oauth2.credentials.Credentials(**credentials)

    youtube = googleapiclient.discovery.build(
        API_SERVICE_NAME, API_VERSION, credentials=credentials)

    request = youtube.liveBroadcasts().transition(
        broadcastStatus="complete",
        id=the_broadcast_id,
        part="id,snippet,contentDetails,status"
    )

    broadcast_transition_response = request.execute()
    print("broadcast_transition_response: ",broadcast_transition_response)

    return broadcast_transition_response
