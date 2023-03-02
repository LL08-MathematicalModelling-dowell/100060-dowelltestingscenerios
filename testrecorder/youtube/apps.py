from django.apps import AppConfig


class YoutubeConfig(AppConfig):
    name = 'youtube'
    
    def ready(self) -> None:
        import youtube.signal
    