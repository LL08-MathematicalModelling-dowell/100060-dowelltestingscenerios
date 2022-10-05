from django.db import models

from django.db import models

class TestRecords(models.Model):
    user_name = models.CharField(max_length=250, default="")
    test_description = models.CharField(max_length=250, default="")
    test_name = models.CharField(max_length=250, default="")
    webcam_file = models.CharField(max_length=250, default="")
    screen_file = models.CharField(max_length=250, default="")
    merged_webcam_screen_file = models.CharField(max_length=250, default="")
    key_log_file = models.FileField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'test_records_table'

class MegaTestRecord(models.Model):
    user_name = models.CharField(max_length=1024, default="")
    test_description = models.CharField(max_length=1024, default="")
    test_name = models.CharField(max_length=1024, default="")
    webcam_file = models.CharField(max_length=1024, default="")
    screen_file = models.CharField(max_length=1024, default="")
    merged_webcam_screen_file = models.CharField(max_length=1024, default="")
    key_log_file = models.CharField(max_length=1024, default="")
    beanote_file = models.CharField(max_length=1024, default="")
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'mega_test_records'

class VpsTestRecord(models.Model):
    user_name = models.CharField(max_length=1024, default="")
    test_description = models.CharField(max_length=1024, default="")
    test_name = models.CharField(max_length=1024, default="")
    user_files_timestamp = models.CharField(max_length=1024, default="")
    webcam_file = models.CharField(max_length=1024, default="")
    screen_file = models.CharField(max_length=1024, default="")
    merged_webcam_screen_file = models.CharField(max_length=1024, default="")
    key_log_file = models.CharField(max_length=1024, default="")
    beanote_file = models.CharField(max_length=1024, default="")
    timestamp = models.DateTimeField(auto_now_add=True)
    clickup_task_notes = models.TextField(default="")
    event_id = models.CharField(max_length=1024, default="")
    Account_info = models.CharField(max_length=1024, default="")
    app_type = models.TextField(default="")

    class Meta:
        db_table = 'vps_test_records'

class VpsIncomingTestRecord(models.Model):
    user_name = models.CharField(max_length=1024, default="")
    test_description = models.CharField(max_length=1024, default="")
    test_name = models.CharField(max_length=1024, default="")
    user_files_timestamp = models.CharField(max_length=1024, default="")
    webcam_file = models.CharField(max_length=1024, default="")
    screen_file = models.CharField(max_length=1024, default="")
    merged_webcam_screen_file = models.CharField(max_length=1024, default="")
    key_log_file = models.FileField(blank=True)
    beanote_file = models.FileField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = False