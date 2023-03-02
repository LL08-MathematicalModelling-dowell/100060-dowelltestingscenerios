from django.contrib import admin

from youtube.models import UserYoutubePlaylists,ChannelsRecord, YouTubeUser

admin.site.register(UserYoutubePlaylists)
admin.site.register(YouTubeUser)
admin.site.register(ChannelsRecord)
