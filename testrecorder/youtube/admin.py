from django.contrib import admin
from youtube.models import UserProfile, ChannelRecord


@admin.register(UserProfile)
class UserProfile(admin.ModelAdmin):
    list_display = ['user__username','api_key', 'credential']
    search_fields = ['user__username']

@admin.register(ChannelRecord)
class ChannelRecord(admin.ModelAdmin):
    list_display = ['channel_id', 'channel_title', 'channel_credentials', 'timestamp']
    search_fields = ['channel_id', 'channel_title']
    list_filter = ['timestamp']
    ordering = ['channel_title']