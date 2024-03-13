from rest_framework import serializers
from .models import TestRecords, MegaTestRecord,VpsTestRecord,VpsIncomingTestRecord


class FileSerializer(serializers.ModelSerializer):
    class Meta():
        model = TestRecords
        fields = ('user_name', 'test_description', 'test_name', 'timestamp','user_files_timestamp')

"""class FileSerializer(serializers.ModelSerializer):
    class Meta():
        model = TestRecords
        fields = ('user_name', 'test_description', 'test_name', 'timestamp',
                    'webcam_file', 'screen_file', 'key_log_file', 'merged_webcam_screen_file')"""

class MegaFileSerializer(serializers.ModelSerializer):
    class Meta():
        model = MegaTestRecord
        fields = ('user_name', 'test_description', 'test_name', 'timestamp',
                    'webcam_file', 'screen_file', 'key_log_file', 'beanote_file', 'merged_webcam_screen_file')

class VpsFileSerializer(serializers.ModelSerializer):
    class Meta():
        model = VpsTestRecord
        fields = ('user_name', 'test_description', 'test_name', 'user_files_timestamp', 'timestamp',
                    'webcam_file', 'screen_file', 'key_log_file', 'beanote_file', 'merged_webcam_screen_file')


class VpsIncomingFileSerializer(serializers.ModelSerializer):
    class Meta():
        model = VpsIncomingTestRecord
        fields = ('user_name', 'test_description', 'test_name', 'user_files_timestamp', 'timestamp',
                    'webcam_file', 'screen_file', 'key_log_file', 'beanote_file', 'merged_webcam_screen_file')

class VpsWebsocketFileSerializer(serializers.ModelSerializer):
    class Meta():
        model = VpsIncomingTestRecord
        fields = ('user_name', 'test_description', 'test_name', 'user_files_timestamp', 'timestamp',
                    'webcam_file', 'screen_file')

