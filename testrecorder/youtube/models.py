from django.db import models

class UserYoutubePlaylists(models.Model):
    """
        Stores users and their youtube playlists
    """
    user_id = models.CharField(max_length=1024, blank=False)
    playlist_id = models.CharField(max_length=1024, blank=False)
    playlist_title = models.CharField(max_length=1024, blank=False)
    playlist_enabled = models.BooleanField(blank=False) # whether playlist is enabled for the user

    class Meta:
        db_table = 'user_youtube_playlists'


class PlaylistsRecord(models.Model):
    """
        Stores daily playlists information.
    """
    playlist_id = models.CharField(max_length=250, blank=False,unique=True)
    playlist_title = models.CharField(max_length=250, blank=False,unique=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'playlists_records'


class ChannelsRecord(models.Model):
    """
        Stores YouTube channels information.
    """
    channel_id = models.CharField(max_length=24, blank=False,unique=True)
    channel_title = models.CharField(max_length=50, blank=False,unique=True)
    channel_credentials = models.TextField(default="")
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'channels_records'
