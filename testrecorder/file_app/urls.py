from django.urls import path
from .views import FileView,BytesView

urlpatterns = [
    path('upload/', FileView.as_view(), name='file-upload'),
    path('upload/bytes/', BytesView.as_view(), name='file-bytes-upload'),
]