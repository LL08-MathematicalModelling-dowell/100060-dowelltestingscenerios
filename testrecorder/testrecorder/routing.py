from django.urls import path

from app_websocket import consumers
from voc_stories_websocket.consumers import VideoConsumer

ws_urlpatterns = [
    path("ws/app/", consumers.VideoConsumer.as_asgi()),
    path("ws/webcamscreen/", consumers.WebacamScreenVideoConsumer.as_asgi()),
    path("ws/taskid/", consumers.TaskIdConsumer.as_asgi()),
    path("ws/brandurl/", VideoConsumer.as_asgi()),
    path("ws/liveuxapi/", consumers.MultiPurposeConsumer.as_asgi()),
]