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
    """Serializer for starting a broadcast"""
    PRIVACY_CHOICE = (
        ('public', 'public'),
        ('private', 'private'),
        ('unlisted', 'unlisted')
    )

    video_privacy = serializers.ChoiceField(choices=PRIVACY_CHOICE, default='public')
    video_title = serializers.CharField(max_length=100)
    playlist_id = serializers.CharField(max_length=100)

class TransitionBroadcastSerializer(serializers.Serializer):
    """Serializer for transitioning a broadcast"""
    BROADCAST_STATUS_CHOICE = (
        ('testing', 'testing'),
        ('live', 'live'),
        ('complete', 'complete')
    )

    broadcast_id = serializers.CharField(max_length=100)
    broadcast_status = serializers.ChoiceField(choices=BROADCAST_STATUS_CHOICE, default='complete')