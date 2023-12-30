from django.urls import path
from .views import (
    HomePageView, AboutPageView,
    PrivacyView,
    library_page
)


urlpatterns = [
    path('', HomePageView.as_view(), name='home'),
    path('about/', AboutPageView.as_view(), name='about'),
    path('privacy/', PrivacyView.as_view(), name='privacy'),
    path('library/', library_page, name='library'),
]
