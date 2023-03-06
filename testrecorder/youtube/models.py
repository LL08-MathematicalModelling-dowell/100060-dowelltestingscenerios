from django.db import models
from django.contrib.auth.models import User
from allauth.socialaccount.models import SocialAccount


class UserYoutubePlaylists(models.Model):
    """
        Stores users and their youtube playlists
    """
    user_id = models.CharField(max_length=1024, blank=False)
    playlist_id = models.CharField(max_length=1024, blank=False)
    playlist_title = models.CharField(max_length=1024, blank=False)
    # whether playlist is enabled for the user
    playlist_enabled = models.BooleanField(blank=False)

    class Meta:
        db_table = 'user_youtube_playlists'


# class PlaylistsRecord(models.Model):
#     """
#         Stores daily playlists information.
#     """
#     playlist_id = models.CharField(max_length=250, blank=False,unique=True)
#     playlist_title = models.CharField(max_length=250, blank=False,unique=True)
#     timestamp = models.DateTimeField(auto_now_add=True)

#     class Meta:
#         db_table = 'playlists_records'


class ChannelsRecord(models.Model):
    """
        Stores YouTube channels information.
    """
    channel_id = models.CharField(max_length=24, blank=False, unique=True)
    channel_title = models.CharField(max_length=50, blank=False, unique=True)
    channel_credentials = models.TextField(default="")
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'channels_records'

    def __str__(self):
        return self.channel_title


class PlaylistsRecord(models.Model):
    """
        Stores daily playlists information.
    """
    playlist_id = models.CharField(max_length=250, blank=False, unique=True)
    playlist_title = models.CharField(max_length=250, blank=False, unique=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'playlists_records'




class YouTubeUser(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    credential = models.JSONField()

    class Meta:
        db_table = 'YouTubeUsers'
        

    def __str__(self):
        return f'{self.user.username} {self.user.first_name}'


