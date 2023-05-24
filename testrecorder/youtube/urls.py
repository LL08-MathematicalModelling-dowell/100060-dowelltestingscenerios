# youtube/urls.py
from django.urls import path
from .views import (logout_view, index, test_api_request, create_broadcast,
                    authorize, oauth2callback, revoke, clear_credentials,
                    CreateBroadcastView, TransitionBroadcastView, PlaylistItemsInsertView,
                    FetchPlaylistsView, CreatePlaylistView, FetchPlaylistsViewV2, FetchChannels,
                    FetchVideos
                    )
from .views_w import UserChannels

urlpatterns = [
    path('', index, name='index'),
    path('authorize/', authorize, name='authorize'),
    path('test/', test_api_request, name='test_api_request'),
    path('createbroadcast/', create_broadcast, name='createbroadcast'),
    path('createbroadcast/api/', CreateBroadcastView.as_view(),
         name='create-broadcast-api'),
    path('transitionbroadcast/api/', TransitionBroadcastView.as_view(),
         name='transition-broadcast-api'),
    path('authorize/', authorize, name='authorize'),
    path('oauth2callback/', oauth2callback, name='oauth2callback'),
    path('revoke/', revoke, name='revoke'),
    path('clear/', clear_credentials, name='clear'),
    path('playlistitemsinsert/api/', PlaylistItemsInsertView.as_view(),
         name='playlist-items-insert-api'),
    path('fetchplaylists/api/', FetchPlaylistsView.as_view(), name='fetch-playlists'),
    path('createplaylist/api/', CreatePlaylistView.as_view(), name='create-playlist'),
    path('fetchplaylists/api/v2', FetchPlaylistsViewV2.as_view(),
         name='fetch-playlists-v2'),
    path('fetchchannels/api/', FetchChannels.as_view(), name='fetch-channels'),
    # URL pattern tha logs a user out
    path('logout/', logout_view, name='logout'),
    path('channels/', UserChannels.as_view(), name='user_channel'),
    path('fetchvideos/', FetchVideos.as_view(), name='fetch_videos'),
]
