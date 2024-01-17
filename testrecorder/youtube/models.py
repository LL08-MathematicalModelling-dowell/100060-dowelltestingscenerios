from django.contrib import admin
from django.db import models
from django.conf import settings


class UserProfile(models.Model):
    """ User Profile Model """
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    api_key = models.CharField(max_length=40, unique=True, blank=True, null=True)
    credential = models.JSONField()

    @admin.display(description='User')
    def user__username(self):
        return self.user.username

    def __str__(self):
        return f'{self.user.username} {self.user.first_name}'


class ChannelRecord(models.Model):
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