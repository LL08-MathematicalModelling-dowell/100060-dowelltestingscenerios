from django.db import models

from django.db import models

"""
class File(models.Model):
    file = models.FileField(blank=False, null=False)
    remark = models.CharField(max_length=20)
    timestamp = models.DateTimeField(auto_now_add=True)
"""

class TestRecords(models.Model):
    user_name = models.CharField(max_length=250, default="")
    test_description = models.CharField(max_length=250, default="")
    test_name = models.CharField(max_length=250, default="")
    webcam_file = models.FileField(blank=True)
    screen_file = models.FileField(blank=True)
    key_log_file = models.FileField(blank=True)
    merged_webcam_screen_file = models.FileField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'test_records_table'