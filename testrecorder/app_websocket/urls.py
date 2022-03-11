from django.urls import path
from .views import videos


urlpatterns = [
    path('', videos, name='websocket_home'),
]