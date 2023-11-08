from rest_framework import serializers


class CreateChannnelSerializer(serializers.Serializer):
    """Serializer for creating a channel"""
    title = serializers.CharField(max_length=100)
    description = serializers.CharField(max_length=1000)