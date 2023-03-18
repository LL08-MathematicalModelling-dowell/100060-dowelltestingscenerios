from django.contrib import admin

from youtube.models import UserYoutubePlaylists,ChannelsRecord, YoutubeUserCredenial

admin.site.register(UserYoutubePlaylists)
admin.site.register(YoutubeUserCredenial)
admin.site.register(ChannelsRecord)
