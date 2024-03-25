from rest_framework import serializers


class CreateChannnelSerializer(serializers.Serializer):
    """Serializer for creating a channel"""
    title = serializers.CharField(max_length=100)
    description = serializers.CharField(max_length=1000)


class CreatePlaylistSerializer(serializers.Serializer):
    """Serializer for creating a playlist"""
    title = serializers.CharField(max_length=100)
    description = serializers.CharField(max_length=1000)
    privacy_status = serializers.CharField(max_length=100)


class StartBroadcastSerializer(serializers.Serializer):
    PRIVACY_CHOICE = (
        ('public', 'public'),
        ('private', 'private'),
        ('unlisted', 'unlisted')
    )

    video_privacy = serializers.ChoiceField(choices=PRIVACY_CHOICE, default='public')
    video_title = serializers.CharField(max_length=100)
    playlist_id = serializers.CharField(max_length=100)
    scheduled_start_time = serializers.DateTimeField(default=None)


class TransitionBroadcastSerializer(serializers.Serializer):
    """Serializer for transitioning a broadcast"""
    BROADCAST_STATUS_CHOICE = (
        ('testing', 'testing'),
        ('live', 'live'),
        ('complete', 'complete')
    )

    broadcast_id = serializers.CharField(max_length=100)
    broadcast_status = serializers.ChoiceField(choices=BROADCAST_STATUS_CHOICE, default='complete')


class YouTubeVideoSerializer(serializers.Serializer):
    """
    Serializer for validating input data to upload a video to YouTube and add it to a playlist.

    Fields:
    - title (str): Title of the video.
    - description (str): Description of the video.
    - tags (list): List of tags for the video.
    - video_path (Filefield): Path to the video file.
    - playlist_id (str): ID of the playlist to add the video to.
    """
    title = serializers.CharField(max_length=100)
    description = serializers.CharField()
    tags = serializers.ListField(child=serializers.CharField())
    video_path = serializers.FileField()
    playlist_id = serializers.CharField()
