from django.urls import path

from app_websocket import consumers

ws_urlpatterns = [
    path("ws/app/", consumers.VideoConsumer.as_asgi()),
    path("ws/webcamscreen/", consumers.WebacamScreenVideoConsumer.as_asgi()),
    path("ws/taskid/", consumers.TaskIdConsumer.as_asgi()),
]