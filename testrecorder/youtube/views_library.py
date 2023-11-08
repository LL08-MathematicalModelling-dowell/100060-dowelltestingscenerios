"""views_library.py
Second views file for the YouTube app.
"""
import logging
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.renderers import JSONRenderer
from googleapiclient.errors import HttpError

from .utils import create_user_youtube_object


logger = logging.getLogger(__name__)


class FetchlibraryPlaylists(APIView):
    renderer_classes = [JSONRenderer]

    def get(self, request, *args, **kwargs):
        try:
            youtube = create_user_youtube_object(request)
            if youtube is None:
                raise AttributeError('youtube object creation failed!!')

            # Fetch all playlists with pagination
            fetch_playlists = True
            playlists = []
            page_token = ""
            while fetch_playlists:
                request = youtube.playlists().list(
                    part='id, snippet,status,contentDetails',
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

            # Check if the playlist is empty
            if len(playlists) == 0:
                return Response({'Error': 'The playlist is empty.'}, status=status.HTTP_204_NO_CONTENT)
            else:
                playlist_details_list = []

                # Iterating through the json list
                for playlist in playlists:
                    playlist_id = playlist.get('id', '')
                    title = playlist.get('snippet', {}).get('title', '')
                    playlist_status = playlist.get(
                        'status', {}).get('privacyStatus', '')
                    total_videos = playlist.get(
                        'contentDetails', {}).get('itemCount', '')
                    thumbnail = playlist.get('snippet', {}).get(
                        'thumbnails', {}).get('medium', {}).get('url', '')

                    playlist_details_list.append({
                        'playlist_id': playlist_id,
                        'playlist_title': title,
                        'privacy_status': playlist_status,
                        'total_videos': total_videos,
                        'thumbnail_url': thumbnail
                    })

            # Current channel title (assuming the first playlist belongs to the same channel)
            channel_title = playlists[0]["snippet"]["channelTitle"]

            # Dictionary with all necessary data
            youtube_details = {
                'channel_title': channel_title,
                'playlists': playlist_details_list
            }

            return Response(youtube_details, status=status.HTTP_200_OK)

        except Exception as err:
            return Response({'Error': str(err)}, status=status.HTTP_400_BAD_REQUEST)


class SelectedPlaylistLoadVideo(APIView):
    """
    API view class for loading all videos from YouTube.

    Methods:
        get(request): Load all videos

     Attributes:
        permission_classes: a list containing the IsAuthenticated permission class to ensure only authenticated users
        can access this view.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request, playlistId):
        """
        Load all videos from YouTube for the specified playlistId.

        Parameters:
            request (HttpRequest): The HTTP request object.
            playlistId (str): The ID of the playlist to load videos from.

        Returns:
            Response: A response containing the loaded videos.

        Raises:
            YoutubeUserCredential.DoesNotExist: If the authenticated user does not have a YoutubeUserCredential object.
            Exception: If an error occurs during the loading process.
        """
        try:
            youtube = create_user_youtube_object(request)
            if youtube is None:
                raise AttributeError('youtube object creation failed!!')

            # Perform the YouTube API call to retrieve videos for the specified playlistId
            playlist_items_response = youtube.playlistItems().list(
                part='snippet',
                playlistId=playlistId,
                maxResults=50
            ).execute()
            playlist_videos = playlist_items_response.get('items', [])

            videos = []

            for videoItem in playlist_videos:
                if 'snippet' not in videoItem\
                    or 'title' not in videoItem['snippet']\
                        or 'resourceId' not in videoItem['snippet']:
                    continue

                video_title = videoItem.get('snippet', {}).get('title', '')
                resource_id = videoItem.get(
                    'snippet', {}).get('resourceId', {})
                if 'videoId' not in resource_id:
                    continue

                videoId = resource_id.get('videoId', '')
                videoTitle = video_title
                videoThumbnail = videoItem\
                    .get('snippet', {})\
                    .get('thumbnails', {})\
                    .get('medium', {})\
                    .get('url', 'No Thumbnail Available')
                videoDescription = videoItem.get(
                    'snippet', {}).get('description', '')

                try:
                    video_response = youtube.videos().list(
                        part='contentDetails, status',
                        id=videoId
                    ).execute()
                    video_info = video_response.get('items', [])[0]
                    privacyStatus = video_info.get(
                        'status', {}).get('privacyStatus', 'Unknown')
                    duration = video_info.get(
                        'contentDetails', {}).get('duration', '00:00')
                except HttpError as e:
                    privacyStatus = 'Unknown'
                    duration = '00:00'

                video_info = {
                    'videoId': videoId,
                    'videoTitle': videoTitle,
                    'videoThumbnail': videoThumbnail,
                    'videoDescription': videoDescription,
                    'privacyStatus': privacyStatus,
                    'duration': duration,
                }
                videos.append(video_info)

                playlist_details = {
                    'playlist_videos': videos
                }

            return Response(playlist_details, status=status.HTTP_200_OK)
        except Exception as e:
            # Return an error message
            return Response({'Error': str(e)}, status=status.HTTP_404_NOT_FOUND)


class RateVideoView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, videoId):
        try:
            rating = request.data.get('rating')
            if rating not in ['like', 'dislike']:
                raise ValueError('Invalid rating value')

            youtube = create_user_youtube_object(request)
            if youtube is None:
                raise AttributeError('youtube object creation failed!!')

            # Perform the YouTube API call to rate the video
            youtube.videos().rate(id=videoId, rating=rating).execute()

            return Response({'message': f'Video {rating}d successfully.'}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'Error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
