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
