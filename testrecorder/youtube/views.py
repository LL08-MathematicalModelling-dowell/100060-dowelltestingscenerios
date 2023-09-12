from django.http import HttpResponse
import os
import json
import pymongo
from googleapiclient.errors import HttpError
from datetime import datetime
from datetime import timedelta
from django.shortcuts import redirect
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from rest_framework.renderers import JSONRenderer
from django.contrib.auth import logout
import logging

from .views_w import create_user_youtube_object

logger = logging.getLogger(__name__)


def index(request):
    return HttpResponse(print_index_table())


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
                "privacyStatus": videoPrivacyStatus,
                "selfDeclaredMadeForKids": False
            },
            "snippet": {
                "scheduledStartTime": future_date_iso,
                "title": videoTitle
            },
            "contentDetails": {
                "enableAutoStart": True,
                "enableAutoStop": True,
                "closedCaptionsType": "closedCaptionsEmbedded",
            }
        }
    )

    insert_broadcast_response = request.execute()
    print(insert_broadcast_response)

    snippet = insert_broadcast_response["snippet"]

    print(
        f'Broadcast ID {insert_broadcast_response["id"]} with title { snippet["title"]} was published at {snippet["publishedAt"]}.')

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
    print('Stream Response ===> ', insert_stream_response)

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
    youtube, credential = create_user_youtube_object(request)
    if youtube is None:
        print('youtube object creation failed!!')
        return Response({'Error': 'Account is not a Google account'}, status=status.HTTP_401_UNAUTHORIZED)

    # create broadcast time
    time_delt1 = timedelta(days=0, hours=0, minutes=5)
    # time_now = datetime.now()
    time_now = datetime.utcnow()
    future_date1 = time_now + time_delt1
    future_date_iso = future_date1.isoformat()

    print(f" <=== Brodcast time {future_date_iso} ====> ")

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
    videoPrivacyStatus = videoPrivacyStatus
    testNameValue = testNameValue
    videoTitle = testNameValue + " " + future_date_iso
    print(future_date_iso)

    request = youtube.liveBroadcasts().insert(
        part="snippet,contentDetails,statistics,status",
        body={
            "status": {
                "privacyStatus": videoPrivacyStatus,
                "selfDeclaredMadeForKids": False
            },
            "snippet": {
                "scheduledStartTime": future_date_iso,
                "title": videoTitle
            },
            "contentDetails": {
                "enableAutoStart": True,
                "enableAutoStop": True,
                "closedCaptionsType": "closedCaptionsEmbedded",
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


class CreateBroadcastView(APIView):
    renderer_classes = [JSONRenderer]

    def post(self, request, *args, **kwargs):
        """
            Creates broadcast using API
        """

        print("Request: ", request)
        print("Request Data: ", request.data)
        print("Request Data Type: ", type(request.data))
        # videoPrivacyStatus = "private"
        # testNameValue = "Test1"
        videoPrivacyStatus = request.data.get("videoPrivacyStatus")
        testNameValue = request.data.get("testNameValue")
        print("videoPrivacyStatus: ", videoPrivacyStatus)
        print("testNameValue: ", testNameValue)

        try:
            stream_dict = self.create_broadcast(
                videoPrivacyStatus, testNameValue, request)
            # stream_dict = {"Hello":"Testing for now!"}
            print("stream_dict: ", stream_dict)
        except HttpError as e:  # Exception as e:
            # HttpError as e:
            error_data = {
                'message': e.reason,
            }
            print(f'Broadcast Error: {error_data}')
            return Response(error_data, status=status.HTTP_403_FORBIDDEN)

        return Response(stream_dict, status=status.HTTP_201_CREATED)

    def create_broadcast(self, videoPrivacyStatus, testNameValue, request):
        """
        Creates a broadcast with a live stream bound
        """
        print('Creating broadcast... ')

        youtube, credential = create_user_youtube_object(request)
        if youtube is None:
            print('youtube object creation failed!!')
            return Response({'Error': 'Account is not a Google account'}, status=status.HTTP_401_UNAUTHORIZED)

        # Check if the user's account has live streaming enabled
        list_response = youtube.liveBroadcasts().list(
            part='id,snippet,contentDetails,status',
            mine=True
        ).execute()
        try:
            channel_id = list_response['items'][0]['snippet']['channelId']
        except:
            logger.critical('User does not have a YouTube channel!!!')
            print('User does not have a YouTube channel!!!')
            raise Exception("User does not have a YouTube channel")

        # Create a new broadcast
        new_broadcast_id = insert_broadcast(
            youtube, videoPrivacyStatus, testNameValue)

        # Create a new stream
        stream_dict = insert_stream(youtube)

        # Bind the stream to the broadcast
        stream_dict['new_broadcast_id'] = new_broadcast_id
        stream_id = stream_dict['newStreamId']
        bind_broadcast(youtube, new_broadcast_id, stream_id)

        # Serialize the stream dictionary to JSON
        json_stream_dict = json.dumps(stream_dict)
        print(json_stream_dict)

        return stream_dict


class TransitionBroadcastView(APIView):
    renderer_classes = [JSONRenderer]

    def post(self, request, *args, **kwargs):
        """
            Transitions broadcast using API
        """

        try:
            print('Transitionig Broadcast...')
            print("Request: ", request)
            print("Request Data: ", request.data)
            print("Request Data Type: ", type(request.data))
            # videoPrivacyStatus = "private"
            # testNameValue = "Test1"
            the_broadcast_id = request.data.get("the_broadcast_id")
            print("the_broadcast_id: ", the_broadcast_id)

            transition_response = transition_broadcast(
                the_broadcast_id, request)
            # transition_response = {"Hello":"Testing for now!"}
            # print("transition_response: ", transition_response)

            return Response(transition_response, status=status.HTTP_200_OK)
        except Exception as e:
            error = {'Error': str(e)}
            return Response(error, status=status.HTTP_400_BAD_REQUEST)


def transition_broadcast(the_broadcast_id, request):

    youtube, credential = create_user_youtube_object(request)
    if youtube is None:
        print('youtube object creation failed!!')
        return Response({'Error': 'Account is not a Google account'}, status=status.HTTP_401_UNAUTHORIZED)

    request = youtube.liveBroadcasts().transition(
        broadcastStatus="complete",
        id=the_broadcast_id,
        part="id,snippet,contentDetails,status"
    )

    broadcast_transition_response = request.execute()
    # print("broadcast_transition_response: ", broadcast_transition_response)
    video_id = broadcast_transition_response['id']
    # print('====== video ID => ', video_id)

    return broadcast_transition_response


class PlaylistItemsInsertView(APIView):
    """
        Handles requests to insert a video into a youtube channel
        playlist
    """
    renderer_classes = [JSONRenderer]

    def post(self, request, *args, **kwargs):
        try:
            # print("Request: ", request)
            print("Request Data: ", request.data)

            # Get the video and playlist data
            the_video_id = request.data.get("videoId")
            the_playlist_id = request.data.get("playlistId")
            print("the_video_id: ", the_video_id)
            print("the_playlist_id: ", the_playlist_id)

            youtube, credential = create_user_youtube_object(request)
            if youtube is None:
                print('youtube object creation failed!!')
                return Response({'Error': 'Account is not a Google account'}, status=status.HTTP_401_UNAUTHORIZED)

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
    # print("date_string: ",date_string)

    playlist_title = date_string + " Daily Playlist"
    # print("playlist_title: ",playlist_title)

    return playlist_title


def fetch_playlists_with_pagination(youtube_object):
    """
        Fetches playlists with the help of pagination
    """
    fetch_playlists = True
    playlists = []
    page_token = ""
    # count = 0

    # Fetch the playlists
    while fetch_playlists:
        request = youtube_object.playlists().list(
            part="snippet,contentDetails",
            maxResults=50,
            mine=True,
            pageToken=page_token
        )
        response = request.execute()

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

    def get(self, request, *args, **kwargs):
        try:
            youtube, credential = create_user_youtube_object(request)
            if youtube is None:
                print('youtube object creation failed!!')
                return Response({'Error': 'Account is not a Google account'}, status=status.HTTP_401_UNAUTHORIZED)

            print('fetching playlist with pagination...')
            # Fetch all playlists with pagination
            playlists = fetch_playlists_with_pagination(youtube)

            # Check if the playlist is empty
            if len(playlists) == 0:
                print("The playlist is empty.")
                return Response({'Error': 'The playlist is empty.'}, status=status.HTTP_204_NO_CONTENT)
            else:
                # playlist id and title dictionary
                user_playlists = {}
                todays_playlist_dict = {}

                # today's playlist title
                todays_playlist_title = get_todays_playlist_title()

                # Current channel title
                channel_title = ""
                # Iterating through the json list
                for playlist in playlists:
                    id = playlist["id"]
                    # print("Playlist ID = ", id)
                    title = playlist["snippet"]["title"]
                    # Filter out daily playlists
                    if "Daily Playlist" not in title:
                        user_playlists[id] = title
                    elif todays_playlist_title == title:
                        todays_playlist_dict["todays_playlist_id"] = id
                        todays_playlist_dict["todays_playlist_title"] = title

                    # Current channel title
                    channel_title = playlist["snippet"]["channelTitle"]

                # Dictionary with all necessary data
                youtube_details = {'channel_title': channel_title,
                                   'user_playlists': user_playlists,
                                   'todays_playlist_dict': todays_playlist_dict}

                return Response(youtube_details, status=status.HTTP_200_OK)

                # return Response(user_playlists, status=status.HTTP_200_OK)
        except Exception as err:
            print("Error while fetching playlists: " + str(err))
            return Response({'Error': str(err)}, status=status.HTTP_400_BAD_REQUEST)


def insert_video_into_playlist(request, the_video_id, the_playlist_id):
    """
        Handles requests to insert a video into a youtube channel
        playlist
    """
    try:
        print("the_video_id: ", the_video_id)
        print("the_playlist_id: ", the_playlist_id)

        youtube, credential = create_user_youtube_object(request)
        if youtube is None:
            print('youtube object creation failed!!')
            return Response({'Error': 'Account is not a Google account'}, status=status.HTTP_401_UNAUTHORIZED)

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
        youtube, credential = create_user_youtube_object(request)
        if youtube is None:
            print('youtube object creation failed!!')
            return Response({'Error': 'Account is not a Google account'}, status=status.HTTP_401_UNAUTHORIZED)

        # Check if a playlist with provided title exists
        playlists = fetch_playlists_with_pagination(youtube)
        for playlist in playlists:
            title = playlist["snippet"]["title"]
            if playlist_title.lower() == title.lower():
                raise Exception(
                    f"A playlist with the title '{playlist_title}' already exists!")

        # Make the insert request
        request = youtube.playlists().insert(
            part="snippet,status",
            body={
                "snippet": {
                    "title": playlist_title,
                    "description": playlist_description,
                    "tags": ["sample playlist", "API call"],
                    "defaultLanguage": "en"
                },
                "status": {"privacyStatus": playlist_privacy_status}
            }
        )
        response = request.execute()
        return response

    except HttpError as err:
        error_msg = f"HTTP error occurred while creating playlist: {err}"
        print(error_msg)
        raise Exception(error_msg)

    except Exception as err:
        error_msg = f"Error occurred while creating playlist: {err}"
        print(error_msg)
        raise Exception(error_msg)


class CreatePlaylistView(APIView):
    """
        DRF API that handles requests to create youtube playlists
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
            response = create_playlist(title, description, privacy, request)
            # print("Playlist creation response: ",response)

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


def logout_view(request):
    '''Logs a user out and redirect to the homepage'''
    logout(request)
    return redirect('/')
