from django.urls import path
from .views import videos,ReceiveTaskIdView


urlpatterns = [
    path('', videos, name='websocket_home'),
    path('clickup/taskid/', ReceiveTaskIdView.as_view(), name='clickup-taskid'),
]