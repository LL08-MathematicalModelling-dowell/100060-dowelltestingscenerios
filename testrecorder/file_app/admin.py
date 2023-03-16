from django.contrib import admin

from file_app.models import TestRecords, MegaTestRecord, VpsTestRecord

"""
admin.site.register(TestRecords)
admin.site.register(MegaTestRecord)
admin.site.register(VpsTestRecord)
"""

@admin.register(TestRecords)
class TestRecordsAdmin(admin.ModelAdmin):
    list_display = ('user_name', 'test_description',
                    'test_name', 'webcam_file', 'merged_webcam_screen_file','timestamp')


@admin.register(MegaTestRecord)
class MegaTestRecordAdmin(admin.ModelAdmin):
    list_display = ('user_name', 'test_description',
                    'test_name', 'webcam_file', 'merged_webcam_screen_file','beanote_file','timestamp')


@admin.register(VpsTestRecord)
class VpsTestRecordAdmin(admin.ModelAdmin):
    list_display = ('user_name', 'test_description',
                    'test_name', 'user_files_timestamp','webcam_file', 'merged_webcam_screen_file','beanote_file','timestamp')
