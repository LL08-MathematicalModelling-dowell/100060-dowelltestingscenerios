from rest_framework import serializers
from .models import TestRecords, MegaTestRecord


class FileSerializer(serializers.ModelSerializer):
    class Meta():
        model = TestRecords
        fields = ('user_name', 'test_description', 'test_name', 'timestamp',
                    'webcam_file', 'screen_file', 'key_log_file', 'merged_webcam_screen_file')

class MegaFileSerializer(serializers.ModelSerializer):
    class Meta():
        model = MegaTestRecord
        fields = ('user_name', 'test_description', 'test_name', 'timestamp',
                    'webcam_file', 'screen_file', 'key_log_file', 'merged_webcam_screen_file')
