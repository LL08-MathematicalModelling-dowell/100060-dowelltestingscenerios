from django.contrib import admin

from youtube.models import UserYoutubePlaylists,ChannelsRecord, YoutubeUserCredential

admin.site.register(UserYoutubePlaylists)
admin.site.register(YoutubeUserCredential)
admin.site.register(ChannelsRecord)
