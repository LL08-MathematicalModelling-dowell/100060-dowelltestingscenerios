from django.urls import path
from .views import HomePageView, CalendlyPageView, AboutPageView, records_view, WebsocketPermissionView, PrivacyView, \
    CamTest, library_page

urlpatterns = [
    path('', HomePageView.as_view(), name='home'),
    path('recordings/', records_view, name='view_records'),
    path('calendly/', CalendlyPageView.as_view(), name='calendly'),
    path('about/', AboutPageView.as_view(), name='about'),
    path('privacy/', PrivacyView.as_view(), name='privacy'),
    path('camtest/', CamTest.as_view(), name='camera-test'),
    path('websocketpermission/', WebsocketPermissionView.as_view(), name='websocketpermission'),
    path('library/', library_page, name='library'),

]
