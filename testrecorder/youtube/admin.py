from django.contrib import admin
from youtube.models import (
    ChannelsRecord, YoutubeUserCredential,
)


#admin.site.register(YoutubeUserCredential)
@admin.register(YoutubeUserCredential)
class YoutubeUserCredentialAdmin(admin.ModelAdmin):
    list_display = ['user__username', 'credential']
    search_fields = ['user__username']

# @admin.register(UserYoutubePlaylists)
# class UserYoutubePlaylistsAdmin(admin.ModelAdmin):
#     list_display = ('user_id', 'playlist_id',
#                     'playlist_title', 'playlist_enabled')


# @admin.register(PlaylistsRecord)
# class PlaylistsRecordAdmin(admin.ModelAdmin):
#     list_display = ('playlist_id', 'playlist_title', 'timestamp')


@admin.register(ChannelsRecord)
class ChannelsRecordAdmin(admin.ModelAdmin):
    list_display = ('channel_id', 'channel_title',
                    'channel_credentials', 'timestamp')
