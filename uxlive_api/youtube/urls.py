from django.urls import path
from .views import (
    logout_view,
    StartBroadcastView,
    TransitionBroadcastView,
    FetchPlaylistsView,
    CreatePlaylistView,
)
from .views_w import (
    DeleteVideoView,
    LoadVideoView,
    YouTubeVideoAPIView,
    UserChannelsView,
    ServiceEndpointsView,
    UploadVideoToYouTube,
)


urlpatterns = [
    path('', ServiceEndpointsView.as_view(), name='youtube-end-points'),
    path('createbroadcast/api/', StartBroadcastView.as_view(), name='create-broadcast-api'),
    path('transitionbroadcast/api/', TransitionBroadcastView.as_view(), name='transition-broadcast-api'),
    path('fetchplaylists/api/', FetchPlaylistsView.as_view(), name='fetch-playlists'),
    path('createplaylist/api/', CreatePlaylistView.as_view(), name='create-playlist'),
    path('logout/', logout_view, name='logout'),
    path('channels/api/', UserChannelsView.as_view(), name='user_channel'),
    path('delete-video/api/', DeleteVideoView.as_view(), name='delete-video'),
    path('videos/api/', LoadVideoView.as_view(), name='videos'),
    path('video/<str:video_id>/', YouTubeVideoAPIView.as_view(), name='youtube_video'),
    path('upload-video/', UploadVideoToYouTube.as_view(), name='upload_video_to_youtube'),
]
