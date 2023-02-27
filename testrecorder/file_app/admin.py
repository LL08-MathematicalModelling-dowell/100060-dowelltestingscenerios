from django.contrib import admin

from file_app.models import TestRecords, MegaTestRecord, VpsTestRecord

admin.site.register(TestRecords)
admin.site.register(MegaTestRecord)
admin.site.register(VpsTestRecord)