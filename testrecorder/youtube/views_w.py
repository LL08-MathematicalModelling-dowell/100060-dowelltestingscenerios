"""
Second views file for the YouTube app.
"""
import logging
from django.core.cache import cache
from django.urls import reverse
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import authentication_classes
from .serializers import YouTubeVideoSerializer


from .models import ChannelRecord
from core.auth import APIKeyAuthentication
from .utils import get_user_cache_key, create_user_youtube_object, upload_video_to_playlist


logger = logging.getLogger(__name__)


@authentication_classes([APIKeyAuthentication])
class UserChannelsView(APIView):
    """
    This class is a DRF APIView that retrieves the authenticated user's YouTube channels.

    Methods:
      get(self, request, *args, **kwargs): Handles GET requests to this view and retrieves the
        channels associated with the currently
        authenticated user's YouTube account.
        Parameters:
        request: DRF Request object
        *args: tuple of positional arguments
        **kwargs: dictionary of keyword arguments

        Functionality:
            The get method retrieves the authenticated user's YouTube channels by first retrieving
            the UserProfile object associated with the authenticated user. It then retrieves the user's
            credentials associated with the UserProfile object and uses them to create a YouTube object using
            the v3 version of the API. It then retrieves the channels associated with the user's account and processes
            them into a list of dictionaries containing the channel id and title. It saves the first channel's details
            to a ChannelRecord object and returns the channels in the response body with a 200 OK status code.
            If an exception is raised during any of the above steps, it returns an error response with a 404
            Not Found status code.

        Returns:
            If successful, returns a DRF Response object with a JSON array of dictionaries containing the channel id and
               title with a 200 OK status code.
            If the user doesn't have a UserProfile object, returns a DRF Response object with an error message
                and a 401 Unauthorized status code.
            If unable to fetch the YouTube channels, returns a DRF Response object with an error message and
                a 404 Not Found status code.

    Attributes:
        permission_classes: a list containing the IsAuthenticated permission class to ensure only authenticated users
        can access this view.
    """
    permission_classes = [IsAuthenticated]
    def get(self, request, *args, **kwargs):
        """
        Retrieve the authenticated user's YouTube channels.
        Returns a JSON array of dictionaries containing the channel id and title
        with a 200 OK status code. If the user doesn't have a UserProfile
        object, returns a 401 Unauthorized status code. If unable to fetch the
        YouTube channels, returns a 404 Not Found status code.
        """
        try:
            user = request.user
            # Generate a user-specific cache key
            cache_key = get_user_cache_key(user.id, '/channels/api/')

            # Attempt to retrieve the response from the cache
            cached_response = cache.get(cache_key, None)

            if cached_response is not None:
                return Response(cached_response, status=status.HTTP_200_OK)
                
            youtube, credential = create_user_youtube_object(request=request)
            if youtube is None:
                return Response({'Error': 'Account is not a Google account'}, status=status.HTTP_401_UNAUTHORIZED)
            
            # Retrieve the channels associated with the user's account
            channels_response = youtube.channels().list(part='snippet', mine=True).execute()
            if 'items' not in channels_response:
                return Response({'Error': 'There is no youtube channel associated with this account!'},
                                status=status.HTTP_404_NOT_FOUND)

            # Process the channels into a list of dictionaries containing the channel id and title
            channels = [
                {
                    'channel_id': channel['id'],
                    'channel_title': channel['snippet']['title']
                }
                for channel in channels_response['items']
            ]

            cache.set(cache_key, channels, 5 * 24 * 60 * 60)

            try:
                # Check if the first channel already exists in the database
                first_channel = channels[0]

                channel_record, created = ChannelRecord.objects.get_or_create(
                    channel_id=first_channel.get('channel_id'),
                    defaults={
                        'channel_title': first_channel.get('channel_title'),
                        'channel_credentials': credential
                    }
                )
                # If the channel already exists, update the credential
                if not created and channel_record.channel_credentials != credential:
                    channel_record.channel_credentials = credential
                    channel_record.save()

            except Exception as e:
                logger.error(
                    f'Error while saving user channel credential locally!: {e} occurred')
            
            return Response(channels, status=status.HTTP_200_OK)

        except Exception as e:
            error_message = str(e)
            return Response(
                {'Error': error_message},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            
 
@authentication_classes([APIKeyAuthentication])
class DeleteVideoView(APIView):
    """
    API view class for deleting a video on YouTube.

    Methods:
        post(request): Delete a video based on the provided video ID.

    Attributes:
        permission_classes: a list containing the IsAuthenticated permission class to ensure only authenticated users
        can access this view.
    """

    # permission_classes = [IsAuthenticated]

    def delete(self, request):
        """
        POST request to delete a YouTube video.

        Parameters:
        - request: The HTTP request object.

        Returns:
        - Response: HTTP response indicating the result of the video deletion.

        Raises:
        - Http404: If the UserProfile object is not found for the authenticated user.
        - Exception: If an error occurs while deleting the video.

        Authorization:
        - The user must be authenticated.

        Example:
        ```
        POST /api/delete-video/ --- (Link yet to implemented)
        {
            "video_id": "your_video_id"
        }
        ```
        """
        try:
            youtube, _ = create_user_youtube_object(request=request)
            if youtube is None:
                # print('youtube object creation failed!!')
                return Response({'Error': 'Account is not a Google account'}, status=status.HTTP_401_UNAUTHORIZED)
            

            video_id = request.data.get('video_id')

            # Delete the video using the video ID
            # If successful, this method returns an HTTP 204 response code (No Content).
            response = youtube.videos().delete(id=video_id).execute()
            return Response({'message': "Video deleted successfully", 'response': response}, status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            return Response({'Error': str(e)})


@authentication_classes([APIKeyAuthentication])
class LoadVideoView(APIView):
    """
    API view class for loading all videos from YouTube.

    Methods:
        get(request): Load all videos

    Attributes:
        permission_classes: a list containing the IsAuthenticated permission class to ensure only authenticated users
        can access this view.
    """
    def get(self, request):
        """
        Load all videos from YouTube.

        Parameters:
            request (HttpRequest): The HTTP request object.

        Returns:
            Response: A response containing the loaded videos.

        Raises:
            UserProfile.DoesNotExist: If the authenticated user does not have a UserProfile object.
            Exception: If an error occurs during the loading process.
        """
        try:
            youtube, _ = create_user_youtube_object(request=request)
            if youtube is None:
                # print('youtube object creation failed!!')
                return Response({'Error': 'Account is not a Google account'}, status=status.HTTP_401_UNAUTHORIZED)
        
            # Perform the YouTube Channels API call
            channels_response = youtube.channels().list(
                part='contentDetails',
                mine=True
            ).execute()

            channels = channels_response.get('items', [])
            if channels:
                channel_id = channels[0]['id']

                # Retrieve videos from each playlist
                playlists_response = youtube.playlists().list(
                    part='snippet,contentDetails',
                    channelId=channel_id,
                    maxResults=50
                ).execute()

                playlists = playlists_response.get('items', [])
                videos = []

                for playlist in playlists:
                    temp_playlist = {}
                    video = {}

                    temp_playlist['playlistTitle'] = playlist['snippet']['title']
                    temp_playlist['playlistId'] = playlist['id']

                    playlist_id = playlist['id']
                    playlist_items_response = youtube.playlistItems().list(
                        part='snippet',
                        playlistId=playlist_id,
                        maxResults=50
                    ).execute()

                    playlist_videos = playlist_items_response.get('items', [])

                    video = [
                        {
                            'videoId': videoItem['snippet']['resourceId']['videoId'],
                            'videoTitle': videoItem['snippet']['title'],
                            'videoThumbnail': videoItem['snippet']['thumbnails'].get('default', {}).get('url', 'No Thumbnail Available'),
                            'videoDescription': videoItem['snippet']['description'],
                        } for videoItem in playlist_videos
                        if videoItem['snippet']['title'] != 'Deleted video'

                    ]

                    temp_playlist['videos'] = video  # playlist_videos

                    videos.append(temp_playlist)
            else:
                # Handle case when no channels are found
                videos = []

            return Response(videos, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'Error': str(e)}, status=status.HTTP_404_NOT_FOUND)


@authentication_classes([APIKeyAuthentication])
class YouTubeVideoAPIView(APIView):
    """
    This class is a DRF APIView that retrieves the authenticated user's YouTube videos.
    Methods:
        get(self, request, *args, **kwargs): Handles GET requests to this view and retrieves the
            videos associated with the currently
            authenticated user's YouTube account.
            Parameters:
            request: DRF Request object
            *args: tuple of positional arguments
            **kwargs: dictionary of keyword arguments
    
            Functionality:
                The get method retrieves the authenticated user's YouTube videos by first retrieving
                the UserProfile object associated with the authenticated user. It then retrieves the user's
                credentials associated with the UserProfile object and uses them to create a YouTube object using
                the v3 version of the API. It then retrieves the videos associated with the user's account and processes
                them into a list of dictionaries containing the video id and title. It saves the first video's details
                to a ChannelRecord object and returns the videos in the response body with a 200 OK status code.
                If an exception is raised during any of the above steps, it returns an error response with a 404
                Not Found status code.
    
            Returns:
                If successful, returns a DRF Response object with a JSON array of dictionaries containing the video id and
                 title with a 200 OK status code.
                If the user doesn't have a UserProfile object, returns a DRF Response object with an error message
                    and a 401 Unauthorized status code.
                If unable to fetch the YouTube videos, returns a DRF Response object with an error message and
                    a 404 Not Found status code.

        get_video_data(self, request, video_id): Retrieves the video data from the YouTube API.
            Parameters:
                request: DRF Request object
                video_id: The ID of the video to retrieve.
            Returns:
                If successful, returns a dictionary containing the video data.
                If the video is not found, returns None.
                If an exception is raised, returns None.
    """
    def get(self, request, video_id):
        # Retrieve the video from the YouTube API
        video_data = self.get_video_data(request, video_id)

        if video_data:
            return Response(video_data)
        else:
            return Response({'error': 'Video not found'}, status=404)

    def get_video_data(self, request, video_id):
        # Set up the YouTube API client
        youtube, _ = create_user_youtube_object(request=request)
        if youtube is None:
            # print('youtube object creation failed!!')
            return Response({'Error': 'Account is not a Google account'}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            # Make a request to the YouTube API to retrieve video details
            response = youtube.videos().list(
                part='snippet',
                id=video_id
            ).execute()

            if 'items' in response and len(response['items']) > 0:
                video_data = response['items'][0]['snippet']
                return video_data
            else:
                return None

        except Exception as e:
            # Handle any error that occurred during the API request
            print(f'An error occurred: {e}')
            return None


@authentication_classes([APIKeyAuthentication])
class UploadVideoToYouTube(APIView):
    """
    API endpoint to upload a video to YouTube and add it to a playlist.

    POST request:
    - Accepts video data including title, description, tags, video path, and playlist ID.
    - Validates the input data.
    - Uploads the video to YouTube.
    - Adds the uploaded video to the specified playlist.

    Returns:
    - HTTP 201 Created with the video ID upon successful upload.
    - HTTP 400 Bad Request with validation errors if the input data is invalid.
    """
    serializer_class = YouTubeVideoSerializer

    def post(self, request, format=None):
        

        youtube, _ = create_user_youtube_object(request=request)
        if youtube is None:
            # print('youtube object creation failed!!')
            return Response({'Error': 'Account is not a Google account'}, status=status.HTTP_401_UNAUTHORIZED)

        serializer = self.serializer_class(data=request.data)
        if serializer.is_valid():
            data = serializer.validated_data
            video_file = request.data['video_path']
            video_id = self._upload_video_to_youtube(video_file, data, youtube)
            return Response({'video_id': video_id}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def _upload_video_to_youtube(self, video, data, youtube):
        """ Call the utility function to upload the video to YouTube. """
        video_id = upload_video_to_playlist(
            youtube,
            video_path=video,
            title=data['title'],
            description=data['description'],
            tags=data['tags'],
            playlist_id=data['playlist_id'],
        )
        return video_id

class ServiceEndpointsView(APIView):
    def get(self, request):
        links = {
            'Start the broadcast': reverse('create-broadcast-api'),
            'Transition the live broadcast': reverse('transition-broadcast-api'),
            'Fetch all playlists': reverse('fetch-playlists'),
            'Create a playlist': reverse('create-playlist'),
            'Logout': reverse('logout'),
            'Fetch user youtube channels': reverse('user_channel'),
            'Delete a a video': reverse('delete-video'),
            'Fetch all videos': reverse('videos'),
            'Fetch a video': reverse('youtube_video', args=['video_id_value']),
            'Upload a video': reverse('upload_video_to_youtube'),
            'websocket Url': 'wss://www.liveuxstoryboard.com/ws/app/?api_key=${apiKey}'
        }

        youtube_links = {k: v for k, v in links.items() if 'youtube' in v}
        # youtube_links['websocket Url'] = 'wss://www.liveuxstoryboard.com/ws/app/?api_key=${apiKey}'

        return Response(youtube_links)
